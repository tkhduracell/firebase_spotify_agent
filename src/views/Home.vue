<template>
  <b-container fluid="lg" class="home">
    <b-row v-if="state && state.item" class="state" align-v="stretch">
      <b-col cols="7" align-self="center">
        <div class="bpm" v-if="current">{{ current.bpm.toFixed() }} BPM</div>

        <div class="header">
          <h1 v-if="current">{{ trackFormat(current) }}</h1>

          <b-row align-v="center" align-h="center">
            <b-col cols="auto"
              ><PlaylistBadge :context="context" v-if="context"
            /></b-col>
            <b-col cols="auto">
              <b-button variant="link" @click="playPrev">
                <b-icon-skip-forward-circle scale="2.0" class="mt-4 mb-4" />
              </b-button>

              <b-button variant="link" @click="play" v-if="state.is_playing">
                <b-icon-pause scale="3.0" class="mt-4 mb-4" />
              </b-button>
              <b-button variant="link" @click="play" v-else>
                <b-icon-play scale="3.0" class="mt-4 mb-4" />
              </b-button>

              <b-button variant="link" @click="playNext">
                <b-icon-skip-backward-circle scale="2.0" class="mt-4 mb-4" />
              </b-button>
            </b-col>
            <b-col cols="auto"
              ><span class="seconds-left">
                {{ seconds.toFixed() }} / {{ secondsMax.toFixed() }} seconds
              </span>
            </b-col>
          </b-row>

          <b-progress height="2rem" :max="secondsMax" class="mb-3 progress">
            <b-progress-bar
              :value="seconds"
              :label="progressLabel"
            ></b-progress-bar>
          </b-progress>
        </div>

        <PlaybackLimiter
          :enabled="settings.timeLimitEnabled"
          @update:enabled="settings.timeLimitEnabled = $event"
          :value="settings.timeLimitSeconds"
          @update:value="settings.timeLimitSeconds = $event"
          class="limiter mb-2"
        />
        <PlaybackAutoQueuer
          :enabled="settings.autoQueueEnabled"
          @update:enabled="settings.autoQueueEnabled = $event"
          :target="settings.autoQueueTarget"
          @update:target="settings.autoQueueTarget = $event"
          :range="settings.autoQueueRange"
          @update:range="settings.autoQueueRange = $event"
        />

        <b-row class="mt-2">
          <b-col cols="4">
            <b-row v-if="state.device">
              <b-col>
                Volume: {{ state.device.volume_percent }}
                <b-icon-volume-up-fill scale="2.0" class="mr-2 ml-2" />
              </b-col>
            </b-row>
            <b-row v-if="settings.autoQueueEnabled && queue.track">
              <b-col>
                <b class="d-block">
                  Next up ({{ queue.sent ? 'queued' : 'suggested' }})
                </b>
                {{ trackFormat(queue.track, true) }}
                <p :class="{ small: true, 'text-danger': queue.pool < 10 }">
                  selected among {{ queue.pool }} other track
                </p>
              </b-col>
            </b-row>
          </b-col>
          <b-col cols="8">
            <b class="d-block">Last {{ historyItems.length }} played items</b>
            <div v-if="historyItems">
              <div
                v-for="(l, idx) in historyItems"
                :key="'h-' + l.id + '-idx-' + idx"
                v-text="trackFormat(l, true)"
              />
              <div v-if="historyItems.length === 0">
                None so far...
              </div>
            </div>
            <div v-else>
              <b-skeleton class="mt-1" width="85%" />
              <b-skeleton class="mt-1" width="55%" />
              <b-skeleton class="mt-1" width="75%" />
            </div>
          </b-col>
        </b-row>
      </b-col>
      <b-col cols="5" align-self="stretch">
        <b-img
          v-for="img in state.item.album.images.filter(i => i.width === 640)"
          :key="img.url"
          fluid
          :src="img.url"
          class="image w-100 shadow"
        />
        <b-sidebar id="sidebar-debug" title="JSON Data" width="60%" shadow>
          <div class="px-3 py-2">
            <pre>{{ JSON.stringify(state, null, 2) }}</pre>
          </div>
        </b-sidebar>
      </b-col>
    </b-row>
    <div v-else-if="state && !state.is_playing">
      <h1>Not playing</h1>
      <p>Play something with you spotify client.</p>
      <b>Try this:</b>
      <b-button
        variant="link"
        @click="play('spotify:playlist:7te7WrFpNb1rjk0WRarnNR')"
      >
        <b-icon-play />
        Freesprut Buggisar
      </b-button>
    </div>
    <div v-else-if="error && error.status === 401">
      <b-card class="bg-dark text-light">
        <p>You have been logged out.</p>
        <b-button variant="primary" href="/" class="w-100"
          >Login me in again!</b-button
        >
      </b-card>
    </div>
    <div v-else>
      Nothing is playing right now.
    </div>
  </b-container>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  reactive,
  ref,
  toRef,
  watch,
} from '@vue/composition-api'

import PlaybackLimiter from '@/components/PlaybackLimiter.vue'
import PlaybackAutoQueuer from '@/components/PlaybackAutoQueuer.vue'
import PlaylistBadge from '@/components/PlaylistBadge.vue'

import { TrackWithBPM, TrackDatabase, toSimple } from '@/tracks'
import { PlaylistDatabase } from '@/playlists'
import { useSpotifyRedirect } from '@/auth'

type Settings = {
  timeLimitEnabled: boolean
  timeLimitSeconds: number
  autoQueueEnabled: boolean
  autoQueueTarget: number
  autoQueueRange: number
}

function usePersistedSettings(defaults: Settings) {
  const prev = sessionStorage.getItem('settings')
  const init = prev ? JSON.parse(prev) : { ...defaults }
  const settings = reactive(init)

  watch(settings, () => {
    sessionStorage.setItem('settings', JSON.stringify(settings))
  })

  return { settings }
}

export default defineComponent({
  name: 'Home',
  components: { PlaybackLimiter, PlaybackAutoQueuer, PlaylistBadge },
  setup(props, { root: { $route } }) {
    const state = ref<SpotifyApi.CurrentlyPlayingResponse>()
    const historyItems = ref<TrackWithBPM[]>([])
    const context = ref<SpotifyApi.PlaylistObjectSimplified>()
    const playlist = ref<TrackWithBPM[]>([])
    const current = ref<TrackWithBPM>()
    const error = ref<SpotifyApi.ErrorObject>()

    const queue = reactive({
      sent: false,
      track: undefined as TrackWithBPM | undefined,
      pool: 0,
    })

    const { settings } = usePersistedSettings({
      timeLimitEnabled: false,
      timeLimitSeconds: 100,
      autoQueueEnabled: false,
      autoQueueTarget: 140,
      autoQueueRange: 10,
    })

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const { client } = useSpotifyRedirect($route, update, update)

    const playlists = new PlaylistDatabase(client)
    const tracks = new TrackDatabase(client)

    function trackFormat(track: TrackWithBPM, showBPM = false): string {
      const bpmSuffix = showBPM ? ' (' + track.bpm.toFixed() + ' bpm)' : ''
      return `${track.artist} - ${track.title}${bpmSuffix}`
    }

    async function update() {
      try {
        const res = (await client.getMyCurrentPlayingTrack()) as
          | ''
          | SpotifyApi.CurrentlyPlayingResponse
        state.value = res === '' ? undefined : res
      } catch (err) {
        if (err.status === 401 && err.responseText) {
          const { error: errorObj } = JSON.parse(err.responseText)
          error.value = errorObj
        }
        console.error(err)
      }
    }

    const seconds = computed(() => {
      return state.value ? (state.value.progress_ms ?? 0) / 1000 : 0
    })
    const secondsTotal = computed(() => {
      return state.value ? (state.value.item?.duration_ms ?? 0) / 1000 : 0
    })
    const secondsMax = computed(() => {
      return settings.timeLimitEnabled
        ? settings.timeLimitSeconds
        : secondsTotal.value
    })

    const progressLabel = computed(() => {
      const end = secondsMax.value
      const current = seconds.value
      const left = Math.max(end - current, 0).toFixed(0)
      const pct = ((current / end) * 100).toFixed(0)
      return current / end < 0.1 ? '' : `${pct}% (${left} seconds left)`
    })

    watch(
      () => state.value?.item?.id,
      async id => {
        if (id) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const item = state.value?.item!
          queue.sent = false
          historyItems.value = [
            await tracks.getTrackWithTempo(toSimple(item)),
            ...historyItems.value,
          ].slice(0, 7)
          current.value = await tracks.getTrackWithTempo(toSimple(item))
        }
      }
    )

    watch(
      () => state.value?.context?.uri,
      async uri => {
        if (uri) {
          const [id] = uri.split(/:/).reverse()
          context.value = await client.getPlaylist(id)
          playlist.value = await tracks.getTracksWithTempo(
            await playlists.getPlaylist(id)
          )
        }
      }
    )

    const isWithin = (v: number, min: number, max: number) => v > min && v < max

    watch(
      [
        playlist,
        current,
        toRef(settings, 'autoQueueTarget'),
        toRef(settings, 'autoQueueRange'),
        toRef(settings, 'autoQueueEnabled'),
      ],
      async source => {
        const [p, , target, range, enabled] = source as [
          TrackWithBPM[],
          TrackWithBPM,
          number,
          number,
          boolean
        ]
        if (enabled && p.length > 0) {
          const matching = p.filter(t =>
            isWithin(t.bpm, target - range, target + range)
          )
          queue.pool = matching.length

          if (matching.length > 0) {
            const seed = Math.round(Math.random() * p.length)
            const t = matching[seed % matching.length]
            queue.track = t
            console.log('Added track for queuing', t.title, t.bpm)
            return
          } else {
            console.warn('No track to queue given', target, '±', range)
          }
        } else {
          queue.track = undefined
        }
      }
    )

    watch(state, s => {
      if (
        s &&
        settings.timeLimitEnabled &&
        (s.progress_ms ?? 0) > settings.timeLimitSeconds * 1000
      ) {
        client.skipToNext()
      }
      if (
        s &&
        settings.autoQueueEnabled &&
        (s.progress_ms ?? 0) + 5000 > secondsMax.value * 1000
      ) {
        if (queue.track && !queue.sent) {
          console.log('Queued track:', queue.track.title, queue.track.bpm)
          client.queue(`spotify:track:${queue.track.id}`)
          queue.sent = true
        }
      }
    })

    async function play(context: string) {
      if (context && typeof context === 'string') {
        // eslint-disable-next-line @typescript-eslint/camelcase
        await client.play({ context_uri: context })
      } else if (state.value && state.value.is_playing) {
        await client.pause()
      } else {
        await client.play()
      }
    }

    async function playNext() {
      await client.skipToNext()
    }
    async function playPrev() {
      await client.skipToPrevious()
    }

    return {
      name,
      seconds,
      secondsTotal,
      secondsMax,
      progressLabel,
      state,
      settings,
      error,
      historyItems,
      trackFormat,
      play,
      playNext,
      playPrev,
      playlist,
      context,
      queue,
      current,
    }
  },
})
</script>

<style lang="scss">
.home {
  .state {
    .header {
      text-align: center;
    }
    .image {
      margin-top: 1em;
    }
    .progress {
      background: #1b5894;
    }
    .seconds-left {
      font-size: 2em;
    }

    .bpm {
      font-size: 7em;
      line-height: 1em;
      text-align: center;
    }
    @media (min-width: 1500px) {
      .bpm {
        font-size: 14em;
      }
      .progress {
        height: 2em !important;
        font-size: 3.4em;
      }
    }

    .debug {
      position: absolute;
      bottom: 0;
    }

    pre {
      text-align: left;
      border: 1px solid gainsboro;
      border-radius: 8px;
    }
  }
}
</style>
