<template>
  <b-container fluid="lg" class="home">
    <b-row v-if="state && state.item" class="state" align-v="stretch">
      <b-col cols="7" align-self="center">
        <div v-if="current" :class="['bpm', isCurrentWithinRange ? '' : 'warntempo']">{{ current.bpm.toFixed() }} BPM</div>

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
              ><span class="seconds-left"> {{ seconds.toFixed() }} / {{ secondsMax.toFixed() }} seconds </span>
            </b-col>
          </b-row>

          <b-progress height="2rem" :max="secondsMax" class="mb-3 seconds">
            <b-progress-bar :value="seconds" :label="progressLabel"></b-progress-bar>
          </b-progress>
        </div>

        <PlaybackLimiter
          :enabled="settings.timeLimitEnabled"
          @update:enabled="settings.timeLimitEnabled = $event"
          :value="settings.timeLimitSeconds"
          @update:value="settings.timeLimitSeconds = $event"
          :progress="seconds"
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
          <b-col cols="6">
            <b-row v-if="settings.autoQueueEnabled && queue.track">
              <b-col class="nextup">
                <b class="label d-block"> Next up ({{ queue.sent ? 'queued' : 'suggested' }}) </b>
                <div class="artist" v-text="queue.track.artist" />
                <div class="title" v-text="queue.track.title" />
                <div class="tempo" v-text="queue.track.bpm.toFixed(0)" />
                <p :class="{ small: true, 'text-danger': queue.pool < 10 }">selected among {{ queue.pool }} other track</p>
              </b-col>
            </b-row>
          </b-col>
          <b-col cols="6">
            <b class="d-block">Last {{ historyItems.length }} played items</b>
            <div v-for="(l, idx) in historyItems" :key="'h-' + l.id + '-idx-' + idx" v-text="trackFormat(l, true)" />
            <div v-if="historyItems.length === 0">
              None so far...
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
      <b-button variant="outline-primary" @click="play('spotify:playlist:7te7WrFpNb1rjk0WRarnNR')">
        <b-icon-play />
        Freesprut Buggisar
      </b-button>
    </b-row>
    <b-row v-else-if="error && error.status === 401">
      <b-card class="bg-dark text-light">
        <p>You have been logged out.</p>
        <b-button variant="primary" href="/" class="w-100">Login me in again!</b-button>
      </b-card>
    </b-row>
    <b-row v-else>
      <b-col class="mt-4" offset="3" cols="6">
        <HelpContent
          :devices="devices ? devices.devices : undefined"
          :device="device"
          @play="play"
          @devices:select="device = $event"
          @devices:reload="loadDevices"
        />
      </b-col>
    </b-row>

    <div class="clock">{{ hhmm }}</div>
  </b-container>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-use-before-define */
import { computed, defineComponent, reactive, ref, toRef, watch } from '@vue/composition-api'

import PlaybackLimiter from '@/components/PlaybackLimiter.vue'
import PlaybackAutoQueuer from '@/components/PlaybackAutoQueuer.vue'
import PlaybackAutoFade from '@/components/PlaybackAutoFade.vue'
import PlaylistBadge from '@/components/PlaylistBadge.vue'
import HelpContent from '@/components/HelpContent.vue'

import { TrackWithBPM, TrackDatabase, toSimple } from '@/tracks'
import { PlaylistDatabase } from '@/playlists'
import { useSpotifyRedirect } from '@/auth'
import { useClock } from '@/clock'
import { useDevices } from '@/devices'
import { useVolume } from '@/volume'

type Settings = {
  timeLimitEnabled: boolean
  timeLimitSeconds: number
  autoQueueEnabled: boolean
  autoQueueTarget: number
  autoQueueRange: number
  autoFadeEnabled: boolean
}

const isWithin = (v: number, min: number, max: number) => v >= min && v <= max

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
    HelpContent,
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

    const { settings }: { settings: Settings } = usePersistedSettings({
      timeLimitEnabled: false,
      timeLimitSeconds: 100,
      autoQueueEnabled: false,
      autoQueueTarget: 140,
      autoQueueRange: 6,
      autoFadeEnabled: false,
    })

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const { client, reauth } = useSpotifyRedirect($route, init, update)
    const clock = useClock()
    const devices = useDevices(client)
    const { startFadeDown, startFadeUp, fading } = useVolume(client)

    const playlists = new PlaylistDatabase(client)
    const tracks = new TrackDatabase(client)

    function trackFormat(track: TrackWithBPM, showBPM = false): string {
      const bpmSuffix = showBPM ? ' (' + track.bpm.toFixed() + ' bpm)' : ''
      return `${track.artist} - ${track.title}${bpmSuffix}`
    }

    async function init() {
      await client.setShuffle(true)
      await update()
    }

    async function update() {
      try {
        const res = (await client.getMyCurrentPlayingTrack()) as '' | SpotifyApi.CurrentlyPlayingResponse
        state.value = res === '' ? undefined : res
        playback.value = await client.getMyCurrentPlaybackState()
      } catch (err) {
        console.error(err)
        if (err.status === 401) reauth() // Authenticated, redirect to loginUrl.
      }
    }

    const seconds = computed(() => {
      return state.value ? (state.value.progress_ms ?? 0) / 1000 : 0
    })
    const secondsTotal = computed(() => {
      return state.value ? (state.value.item?.duration_ms ?? 0) / 1000 : 0
    })
    const secondsMax = computed(() => {
      return settings.timeLimitEnabled ? settings.timeLimitSeconds : secondsTotal.value
    })

    const progressLabel = computed(() => {
      const end = secondsMax.value
      const current = seconds.value
      const left = Math.max(end - current, 0).toFixed(0)
      const pct = ((current / end) * 100).toFixed(0)
      return current / end < 0.1 ? '' : `${pct}% (${left} sec left)`
    })

    watch(
      () => state.value?.item?.id,
      async id => {
        if (id) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const item = state.value?.item!
          if (settings.autoQueueEnabled && queue.track && queue.track?.id !== id && queue.sent) {
            console.warn(
              '[Queue] New played item was not as queued, expected: \n',
              `${queue.track.title} (${queue.track.id})`,
              'got:\n',
              `${item.name} (${item.id})\n`,
              'Skipping to next!'
            )
            await client.skipToNext()
          }
          queue.sent = false
          historyItems.value = [await tracks.getTrackWithTempo(toSimple(item)), ...historyItems.value].slice(0, 7)
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
          playlist.value = await tracks.getTracksWithTempo(await playlists.getPlaylist(id))
        }
      }
    )

    const isCurrentWithinRange = computed(() => {
      const min = settings.autoQueueTarget
      const max = settings.autoQueueTarget + settings.autoQueueRange
      return settings.autoQueueEnabled ? isWithin(current.value?.bpm ?? 0, min, max) : true
    })

    function getRandomUnplayed(items: TrackWithBPM[]): TrackWithBPM | undefined {
      let i = 0
      while (i < 10 && items.length > 0) {
        const seed = Math.round(Math.random() * items.length) % items.length
        const track = items[seed]
        const inHistory = historyItems.value.find(({ id }) => track.id === id)
        if (!inHistory) {
          return track
        }
        console.warn(`Track ${track.title} has been played recently, trying another one...`)
        i++
      }
      return undefined
    }

    watch(
      [playlist, current, toRef(settings, 'autoQueueTarget'), toRef(settings, 'autoQueueRange'), toRef(settings, 'autoQueueEnabled')],
      async source => {
        const [p, , target, range, enabled] = source as [TrackWithBPM[], TrackWithBPM, number, number, boolean]
        if (enabled && p.length > 0) {
          const matching = p.filter(t => isWithin(t.bpm, target, target + range))
          queue.pool = matching.length

          if (matching.length > 0) {
            queue.track = getRandomUnplayed(matching)
            console.log('[Queue] Added track for queuing', queue.track?.title, queue.track?.bpm)
            return
          } else {
            console.warn('[Queue] No track to queue given', target, '⌥', range)
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

      if (settings.autoQueueEnabled && passed(s, secondsMax.value - 10)) {
        if (queue.track && !queue.sent) {
          console.log('[Queue] Add track to queue:', queue.track.title, queue.track.bpm)
          await client.queue(`spotify:track:${queue.track.id}`)
          queue.sent = true
        }
      }

      if (settings.autoFadeEnabled && passed(s, secondsMax.value - 5)) {
        startFadeDown(playback.value?.device.volume_percent ?? undefined)
      }

      if (settings.autoFadeEnabled && !passed(s, 5)) {
        startFadeUp()
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
      if (settings.autoQueueEnabled && queue.track && !queue.sent) {
        settings.timeLimitEnabled = false
        settings.autoFadeEnabled = false

        console.log('[Skip]: Queuing: ', queue.track.title)
        await client.queue(`spotify:track:${queue.track.id}`)
        queue.sent = true

        console.log('[Skip]: Fade out!')
        await startFadeDown(playback.value?.device.volume_percent ?? undefined)

        console.log('[Skip]: Skipping to queued item!')
        await client.skipToNext()

        settings.autoFadeEnabled = true
        settings.timeLimitEnabled = true
      } else {
        await client.skipToNext()
      }
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
      isCurrentWithinRange,
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

      &.warntempo {
        color: red;
        animation: pulse-animation 1s infinite;
      }

      @keyframes pulse-animation {
        0% {
          opacity: 1;
        }
        50% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }
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

    .nextup {
      .label {
        font-size: 90%;
      }
      .artist {
        font-size: 160%;
      }
      .title {
        font-size: 120%;
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
