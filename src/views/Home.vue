<template>
  <b-container fluid="lg" class="home">
    <b-row v-if="state && state.item" class="state" align-v="stretch">
      <b-col cols="7" align-self="center">
        <div class="bpm" v-if="current">{{ current.bpm.toFixed() }} BPM</div>

        <div class="header">
          <h1 v-if="current">{{ trackFormat(current) }}</h1>

          <b-row align-v="center" align-h="center">
            <b-col cols="auto">
              <PlaylistBadge :context="context" v-if="context" />
            </b-col>
            <b-col cols="auto">
              <b-button variant="link" @click="playPrev" :disabled="queue.sent">
                <b-icon-skip-forward-circle scale="2.0" class="mt-4 mb-4" />
              </b-button>

              <b-button variant="link" @click="play" v-if="state.is_playing">
                <b-icon-pause scale="3.0" class="mt-4 mb-4" />
              </b-button>
              <b-button variant="link" @click="play" v-else>
                <b-icon-play scale="3.0" class="mt-4 mb-4" />
              </b-button>

              <b-button variant="link" @click="playNext" :disabled="queue.sent">
                <b-icon-skip-backward-circle scale="2.0" class="mt-4 mb-4" />
              </b-button>
            </b-col>
            <b-col cols="auto"
              ><span class="seconds-left">
                {{ seconds.toFixed() }} / {{ secondsMax.toFixed() }} seconds
              </span>
            </b-col>
          </b-row>

          <b-progress height="2rem" :max="secondsMax" class="mb-3 seconds">
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
        <PlaybackAutoFade
          :enabled="settings.autoFadeEnabled"
          @update:enabled="settings.autoFadeEnabled = $event"
          :volume="playback.device.volume_percent"
          :is-fading="fading.fadedown || fading.fadeup"
          v-if="playback"
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
      </b-col>
    </b-row>
    <b-row v-else-if="state && !state.is_playing" align-h="center">
      <h1>Not playing</h1>
      <p>Play something with you spotify client.</p>
      <b>Try this:</b>
      <b-button
        variant="outline-primary"
        @click="play('spotify:playlist:7te7WrFpNb1rjk0WRarnNR')"
      >
        <b-icon-play />
        Freesprut Buggisar
      </b-button>
    </b-row>
    <b-row v-else-if="error && error.status === 401">
      <b-card class="bg-dark text-light">
        <p>You have been logged out.</p>
        <b-button variant="primary" href="/" class="w-100"
          >Login me in again!</b-button
        >
      </b-card>
    </b-row>
    <b-row v-else>
      <b-col class="mt-4" offset="3" cols="6">
        <h1>Welcome to Spotify Agent!</h1>
        <p>
          This is a music tool written to ease Spotify playback during dance
          traning.
        </p>
        <h2>How do I use it?</h2>
        <p>Let's go through each step.</p>
        <h4>1. Open this page (you're done already, great!)</h4>
        <p>Open this page in any modern browser.</p>
        <h4>2. Open Spotify</h4>
        <p>
          Open Spotify on your computer or use your mobile.
        </p>
        <h4>3. Play a playlist</h4>
        <p>
          Find a playlist with <b>MANY</b> tracks that can be the source for you
          playback. If you don't have anyone, you can choose to start the one
          below.
        </p>
        <p>
          <b>Start a playlist</b>
        </p>
        <div class="mb-4">
          <b-button
            variant="outline-primary"
            @click="loadDevices()"
            class="mr-2"
          >
            <b-icon-arrow-counterclockwise />
          </b-button>
          <b-form-select v-model="device" v-if="devices" class="w-50 mr-2">
            <b-form-select-option
              v-for="dev in devices.devices"
              :key="dev.id"
              :value="dev"
            >
              {{ dev.name }} ({{ dev.type }})
            </b-form-select-option>
          </b-form-select>
          <b-button
            variant="outline-primary"
            @click="play('spotify:playlist:7te7WrFpNb1rjk0WRarnNR', device)"
          >
            <b-icon-play />
            Freesprut Buggisar
          </b-button>
        </div>
        <h4>Current features</h4>
        <ul>
          <li>Switch track after a fixed number of seconds.</li>
          <li>Limit playlist to a tempo range.</li>
          <li>Lower volume between tracks.</li>
        </ul>
      </b-col>
    </b-row>

    <div class="clock">{{ hhmm }}</div>
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
import PlaybackAutoFade from '@/components/PlaybackAutoFade.vue'
import PlaylistBadge from '@/components/PlaylistBadge.vue'

import { TrackWithBPM, TrackDatabase, toSimple } from '@/tracks'
import { PlaylistDatabase } from '@/playlists'
import { useSpotifyRedirect } from '@/auth'
import { useClock } from '@/clock'
import { useDevices } from '@/devices'

type Settings = {
  timeLimitEnabled: boolean
  timeLimitSeconds: number
  autoQueueEnabled: boolean
  autoQueueTarget: number
  autoQueueRange: number
  autoFadeEnabled: boolean
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
  components: {
    PlaybackLimiter,
    PlaybackAutoQueuer,
    PlaybackAutoFade,
    PlaylistBadge,
  },
  setup(props, { root: { $route } }) {
    const state = ref<SpotifyApi.CurrentlyPlayingResponse>()
    const playback = ref<SpotifyApi.CurrentPlaybackResponse>()
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
    const fading = reactive({
      fadedown: false,
      fadeup: false,
      volume: 0 as number | null | undefined,
    })

    const { settings } = usePersistedSettings({
      timeLimitEnabled: false,
      timeLimitSeconds: 100,
      autoQueueEnabled: false,
      autoQueueTarget: 140,
      autoQueueRange: 10,
      autoFadeEnabled: false,
    })

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const { client } = useSpotifyRedirect($route, update, update)
    const clock = useClock()
    const devices = useDevices(client)

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

        playback.value = await client.getMyCurrentPlaybackState()
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
          if (
            settings.autoQueueEnabled &&
            queue.track &&
            queue.track?.id !== id
          ) {
            console.warn(
              'New played item was not as queued, expected: ',
              queue.track,
              'got:',
              item.id
            )
          }
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

    function passed(cpr: SpotifyApi.CurrentlyPlayingResponse, seconds: number) {
      return (cpr.progress_ms ?? 0) > seconds * 1000
    }

    watch(state, async s => {
      if (!s) return

      if (settings.timeLimitEnabled && passed(s, settings.timeLimitSeconds)) {
        await client.skipToNext()
      }

      if (settings.autoQueueEnabled && passed(s, secondsMax.value - 5)) {
        if (queue.track && !queue.sent) {
          console.log('Queued track:', queue.track.title, queue.track.bpm)
          await client.queue(`spotify:track:${queue.track.id}`)
          queue.sent = true
        }
      }

      if (settings.autoFadeEnabled && passed(s, secondsMax.value - 5)) {
        /* Go down */

        if (!fading.fadedown) {
          const p = (fading.volume = playback.value?.device.volume_percent)
          if (p) {
            console.log('Starting to fade down from', p, '->', 0)
            setTimeout(() => client.setVolume(Math.round(p * 0.9)), 0)
            setTimeout(() => client.setVolume(Math.round(p * 0.8)), 500)
            setTimeout(() => client.setVolume(Math.round(p * 0.7)), 1000)
            setTimeout(() => client.setVolume(Math.round(p * 0.6)), 1500)
            setTimeout(() => client.setVolume(Math.round(p * 0.5)), 2000)
            setTimeout(() => client.setVolume(Math.round(p * 0.4)), 2500)
            setTimeout(() => client.setVolume(Math.round(p * 0.3)), 3500)
            setTimeout(() => client.setVolume(Math.round(p * 0.2)), 4000)
            setTimeout(() => client.setVolume(Math.round(p * 0.1)), 4500)
            setTimeout(() => client.setVolume(0), 5000)

            fading.fadedown = true
            return
          }
        }
      }

      if (settings.autoFadeEnabled && !passed(s, 5)) {
        if (fading.fadedown && !fading.fadeup) {
          const p = fading.volume
          if (p) {
            console.log('Starting to fade up from 0 ->', p)
            setTimeout(() => client.setVolume(Math.round(p * 0.1)), 0)
            setTimeout(() => client.setVolume(Math.round(p * 0.2)), 500)
            setTimeout(() => client.setVolume(Math.round(p * 0.3)), 1000)
            setTimeout(() => client.setVolume(Math.round(p * 0.4)), 1500)
            setTimeout(() => client.setVolume(Math.round(p * 0.5)), 2000)
            setTimeout(() => client.setVolume(Math.round(p * 0.6)), 2500)
            setTimeout(() => client.setVolume(Math.round(p * 0.7)), 3500)
            setTimeout(() => client.setVolume(Math.round(p * 0.8)), 4000)
            setTimeout(() => client.setVolume(Math.round(p * 0.9)), 4500)
            setTimeout(() => {
              client.setVolume(p).finally(() => {
                fading.fadeup = false
                fading.fadedown = false
              })
            }, 5000)

            fading.fadeup = true
            return
          }
        }
      }
    })

    async function play(context: string, device?: SpotifyApi.UserDevice) {
      if (context && typeof context === 'string') {
        // eslint-disable-next-line @typescript-eslint/camelcase
        const dev = device && device.id ? { device_id: device.id } : {}
        // eslint-disable-next-line @typescript-eslint/camelcase
        await client.play({ context_uri: context, ...dev })
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
      ...clock,
      ...devices,
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
      playback,
      fading,
    }
  },
})
</script>

<style lang="scss">
.home {
  position: relative;
  .clock {
    position: absolute;
    top: -20px;
    left: 6px;
    font-size: 2em;
  }

  .state {
    .header {
      text-align: center;
    }
    .image {
      margin-top: 1em;
    }
    .seconds {
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
    @media (min-width: 1700px) {
      .bpm {
        font-size: 14em;
      }
      .seconds {
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
