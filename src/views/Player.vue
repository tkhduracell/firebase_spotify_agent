<template lang="html">
  <b-container fluid="lg" class="home">
    <b-row v-if="state && state.item" class="state" align-v="stretch">
      <b-col cols-sm="12" cols-md="12" cols-lg="7" align-self="center">
        <div v-if="current && current.bpm" :class="['bpm', isCurrentWithinRange ? '' : 'warntempo']">{{ current.bpm.toFixed() }} BPM</div>
        <div class="header">
          <div class="clearfix">
            <h1 v-if="current">
              {{ trackFormat(current) }}
              <div v-b-modal="'trackedit'" class="d-inline-block" v-if="canEdit">
                <b-icon-pencil-fill scale="0.5" />
              </div>
            </h1>
          </div>

          <b-row align-v="center">
            <b-col cols="12">
              <span class="seconds-left"> {{ secondsPlayed.toFixed() }} / {{ secondsMax.toFixed() }} seconds </span>
            </b-col>
          </b-row>
          <b-row align-v="center" align-h="center" class="control-buttons">
            <b-col cols="auto">
              <b-button variant="link" :disabled="queue.sent" @click="playPrev">
                <b-icon-skip-forward-circle scale="2.0" class="mt-4 mb-4" />
              </b-button>

              <b-button variant="link" @click="playAgain" :disable="queue.sent" class="again">
                <b-icon-arrow-counterclockwise scale="1.4" class="mt-4 mb-4" />
              </b-button>

              <b-button variant="link" @click="play" v-if="state.is_playing">
                <b-icon-pause scale="3.0" class="mt-4 mb-4" />
              </b-button>
              <b-button variant="link" @click="play" v-else>
                <b-icon-play scale="3.0" class="mt-4 mb-4" />
              </b-button>

              <b-button variant="link" :disabled="queue.sent" @click="playNext">
                <b-icon-skip-backward-circle scale="2.0" class="mt-4 mb-4" />
              </b-button>
            </b-col>
            <div style="position: absolute; right:0">
              <b-button variant="link" :disabled="queue.sent" v-b-modal="'select-track'">
                <b-icon-search scale="1.4" class="mr-2" />
                Select song
              </b-button>
            </div>

          </b-row>

          <b-row align-v="center" align-h="center" class="device mb-3"  v-if="playback && playback.device">
            <b-col cols="12" v-if="thisDevice && playback.device.id !== thisDevice.id">
              <small><b-link @click="playHere" href="#">Play here instead</b-link></small>
            </b-col>
          </b-row>

          <b-progress height="2rem" :max="secondsMax" class="mb-3 seconds">
            <b-progress-bar :value="secondsPlayed" :label="progressLabel"></b-progress-bar>
          </b-progress>
        </div>

        <b-overlay :show="fading.fadedown || fading.fadeup" rounded="sm" variant="dark">
          <PlaybackLimiter
            :enabled="settings.timeLimitEnabled"
            @update:enabled="settings.timeLimitEnabled = $event"
            :value="settings.timeLimitSeconds"
            @update:value="settings.timeLimitSeconds = $event"
            :progress="secondsPlayed"
            class="mb-2"
          />
          <PlaybackAutoFade
            :enabled="settings.autoFadeEnabled"
            @update:enabled="settings.autoFadeEnabled = $event"
            :volume="volume || 0"
            :is-fading="fading.fadedown || fading.fadeup"
            @update:volume="setVolumeDelta"
            v-if="playback"
            class="mb-2"
          />
          <PlaybackAutoQueuer
            :enabled="settings.autoQueueEnabled"
            @update:enabled="settings.autoQueueEnabled = $event"
            :target="settings.autoQueueTarget"
            @update:target="settings.autoQueueTarget = $event"
            :range="settings.autoQueueRange"
            @update:range="settings.autoQueueRange = $event"
            class="mb-2"
          />
          <PlaybackAutoClimb
            :disabled="!settings.autoQueueEnabled"
            :enabled="settings.autoClimbEnabled"
            @update:enabled="settings.autoClimbEnabled = $event"
            :min="settings.autoClimbMin"
            @update:min="settings.autoClimbMin = $event"
            :max="settings.autoClimbMax"
            @update:max="settings.autoClimbMax = $event"
            :step="settings.autoClimbStep"
            @update:step="settings.autoClimbStep = $event"
            :limit="settings.timeLimitEnabled ? settings.timeLimitSeconds : undefined"
            class="mb-2"
          />
        </b-overlay>

        <b-row class="mt-2">
          <b-col cols="6">
            <b-row>
              <b-col class="nextup" v-if="queue.loading || settings.autoQueueEnabled">
                <NextUp :queue="queue" />
              </b-col>
            </b-row>
          </b-col>
          <b-col cols="6">
            <b class="d-block">Last played</b>
            <div v-for="(l, idx) in historyItems" :key="'h-' + l.id + '-' + idx" v-text="trackFormat(l, true)" />
            <div v-if="historyItems.length === 0">
              None so far...
            </div>
          </b-col>
        </b-row>
      </b-col>
      <b-col cols="5" class="d-none d-lg-block position-relative">
        <PlaylistSelector :context="context" :items="presets" v-if="context" @play="play($event)" />
        <b-img
          v-for="img in state.item.album.images.filter(i => i.width === 640)"
          :key="img.url"
          fluid
          :src="img.url"
          class="image w-100 shadow"
        />
      </b-col>
    </b-row>
    <b-row v-else-if="error && error.status === 401">
      <b-card class="bg-dark text-light">
        <p>You have been logged out.</p>
        <b-button variant="primary" href="/" class="w-100">Login me in again!</b-button>
      </b-card>
    </b-row>

    <div class="clock">{{ hhmm }}</div>
    <EditModal v-if="current" :track="current" @update:track="updateTrackInfo" @skip:track="playNext" />
    <SelectSongModal :playlist="playlist" @play="playTrack" />
  </b-container>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, toRef, watch } from '@vue/composition-api'

import PlaybackLimiter from '@/components/PlaybackLimiter.vue'
import PlaybackAutoQueuer from '@/components/PlaybackAutoQueuer.vue'
import PlaybackAutoClimb from '@/components/PlaybackAutoClimb.vue'
import PlaybackAutoFade from '@/components/PlaybackAutoFade.vue'
import PlaylistSelector from '@/components/PlaylistSelector.vue'
import StartSceen from '@/components/StartSceen.vue'
import NextUp from '@/components/NextUp.vue'
import EditModal from '@/components/EditModal.vue'
import SelectSongModal from '@/components/SelectSongModal.vue'
import DeviceIcon from '@/components/DeviceIcon.vue'

import { TrackWithBPM, TrackDatabase, trackFormat, toSimple } from '@/tracks'
import { PlaylistDatabase } from '@/playlists'
import { useClock } from '@/clock'
import { useDevices } from '@/devices'
import { useVolume } from '@/volume'
import { QueueState, SpotifyApi } from '@/types'
import { useHotKeys } from '@/hotkeys'
import { usePresets } from '@/presets'
import { useUserState } from '@/state'
import { useSpotifyClient } from '@/auth'
import { usePlaybackState } from '@/playing'
import { sleep } from '@/sleep'
import { useThrottleFn } from '@vueuse/core'
import { usePlayer } from '@/player'

type Settings = {
  timeLimitEnabled: boolean
  timeLimitSeconds: number
  autoQueueEnabled: boolean
  autoQueueTarget: number
  autoQueueRange: number
  autoClimbEnabled: boolean
  autoClimbMin: number
  autoClimbMax: number
  autoClimbStep: number
  autoFadeEnabled: boolean
}

const isWithin = (v: number, min: number, max: number) => v >= min && v <= max

function usePersistedSettings (defaults: Settings) {
  const prev = sessionStorage.getItem('settings')
  const init = prev ? JSON.parse(prev) : { ...defaults }
  const settings = reactive(init)

  watch(settings, () => {
    sessionStorage.setItem('settings', JSON.stringify(settings))
  })

  return { settings }
}

export default defineComponent({
  components: {
    PlaybackLimiter,
    PlaybackAutoQueuer,
    PlaybackAutoClimb,
    PlaybackAutoFade,
    PlaylistSelector,
    StartSceen,
    NextUp,
    EditModal,
    SelectSongModal,
    DeviceIcon
  },
  setup (props, { root: { $root, $router } }) {
    const userState = useUserState()

    const historyItems = ref<TrackWithBPM[]>([])
    const context = ref<SpotifyApi.PlaylistObjectSimplified>()
    const playlist = ref<TrackWithBPM[]>([])
    const current = ref<TrackWithBPM>()
    const error = ref<SpotifyApi.ErrorObject>()

    const queue = reactive<QueueState>({
      loading: true,
      sent: false,
      track: undefined as TrackWithBPM | undefined,
      pool: 0
    })

    const { settings }: { settings: Settings } = usePersistedSettings({
      autoFadeEnabled: true,
      timeLimitEnabled: false,
      timeLimitSeconds: 100,
      autoQueueEnabled: false,
      autoQueueTarget: 140,
      autoQueueRange: 6,
      autoClimbEnabled: false,
      autoClimbMin: 120,
      autoClimbMax: 240,
      autoClimbStep: 5
    })

    const { client } = useSpotifyClient()
    const { player } = usePlayer()

    const clock = useClock()
    const devices = useDevices()

    const playlists = new PlaylistDatabase(client)
    const tracks = new TrackDatabase(client)

    const dev = computed(() => playback.value?.device?.id ? { device_id: playback.value.device.id } : undefined)

    const { state, playback, secondsPlayed, secondsTotal, volume, setVolume, setVolumeThrottled } = usePlaybackState(client)
    const { startFadeDown, startFadeUp, fading } = useVolume(player)

    function setVolumeDelta (delta: number) {
      if (volume.value !== undefined && volume.value !== null) {
        const vol = volume.value + delta
        const clamped = Math.min(100, Math.max(vol, 0))
        setVolume(clamped)
        setVolumeThrottled(clamped)
        player.setVolume(clamped, dev.value)
      }
    }

    watch(() => state.value, (p) => {
      if (!p || (!p?.is_playing && !p?.item)) {
        $router.push({ name: 'Start' })
      }
    })

    const secondsMax = computed(() => {
      return settings.timeLimitEnabled ? Math.min(settings.timeLimitSeconds, secondsTotal.value) : secondsTotal.value
    })

    const progressLabel = computed(() => {
      const end = secondsMax.value
      const current = secondsPlayed.value
      const left = Math.max(end - current, 0).toFixed(0)
      const pct = Math.min(100, (current / end) * 100).toFixed(0)
      return current / end < 0.1 ? '' : `${pct}% (${left} sec left)`
    })

    watch(
      () => state.value?.item?.id,
      async id => {
        if (id) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
          const item = state.value?.item!
          historyItems.value = [await tracks.getTrackWithTempo(item.id), ...historyItems.value].slice(0, 5)
          current.value = await tracks.getTrackWithTempo(item.id)
        }
      }
    )

    watch(
      () => state.value?.context?.uri,
      async uri => {
        if (uri) {
          const [id] = uri.split(/:/).reverse()
          queue.loading = true
          context.value = await client.getPlaylist(id)

          // eslint-disable-next-line no-inner-declarations
          function playlistProgress (i: number, tot: number) {
            queue.loading = `Loading playlist tracks ${i} / ${tot}`
          }

          // eslint-disable-next-line no-inner-declarations
          function trackProgress (i: number, tot: number) {
            queue.loading = `Loading track tempo ${i} / ${tot}`
          }
          const playlistTracks = await playlists.getPlaylistTracks(id, playlistProgress)
          playlist.value = await tracks.getTracksWithTempo(playlistTracks, trackProgress)
          queue.loading = false
          if (current.value) {
            const { id } = current.value
            current.value = await tracks.getTrackWithTempo(id)
          }
        }
      }
    )

    const isCurrentWithinRange = computed(() => {
      if (fading.fadedown || fading.fadeup) return true
      const min = settings.autoQueueTarget
      const max = settings.autoQueueTarget + settings.autoQueueRange
      if (settings.autoClimbEnabled) {
        // If climb is enabled we have already steped up group up
        return settings.autoClimbMin === min
          ? isWithin(current.value?.bpm ?? 0, settings.autoClimbMax, settings.autoClimbMax + settings.autoQueueRange)
          : isWithin(current.value?.bpm ?? 0, min - settings.autoClimbStep, max - settings.autoClimbStep)
      } else {
        return settings.autoQueueEnabled ? isWithin(current.value?.bpm ?? 0, min, max) : true
      }
    })

    function getRandomUnplayed (items: TrackWithBPM[]): TrackWithBPM | undefined {
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

    function computeNextTrack (playlist: TrackWithBPM[], base: number, range: number) {
      queue.loading = true
      const matching = playlist.filter(t => isWithin(t.bpm, base, base + range))
      queue.pool = matching.length

      if (matching.length > 0) {
        queue.track = getRandomUnplayed(matching)
        console.log('[Queue] Computed track for queuing', queue.track?.title, queue.track?.bpm)
      } else {
        console.warn('[Queue] No track to queue given', base, '⌥', range)
      }
      queue.loading = false
    }

    watch(
      [playlist, toRef(settings, 'autoQueueTarget'), toRef(settings, 'autoQueueRange'), toRef(settings, 'autoQueueEnabled')],
      async source => {
        const [pl, autoQueueTarget, autoQueueRange, autoQueueEnabled] = source as [TrackWithBPM[], number, number, boolean]
        if (autoQueueEnabled && pl.length > 0) {
          computeNextTrack(pl, autoQueueTarget, autoQueueRange)
        } else {
          queue.track = undefined
        }
      }
    )

    function passed (progress_ms: number | undefined | null, seconds: number) {
      return (progress_ms ?? 0) > seconds * 1000
    }

    const throttledSkip = useThrottleFn(() => {
      console.log('[Skip] Skipping to next song')
      return player.nextTrack(dev.value)
    }, 5000)

    // Log playback on track id change
    watch(() => state.value?.item?.id, s => console.log('[Playback] Now playing track', state.value?.item?.name))

    // Compute new queue
    watch(() => state.value?.item?.id, s => {
      computeNextTrack(playlist.value, settings.autoQueueTarget, settings.autoQueueRange)
    })

    // Execute auto-step on track id change
    watch(() => state.value?.item?.id, s => {
      if (settings.autoQueueEnabled && settings.autoClimbEnabled) {
        const prev = settings.autoQueueTarget
        const newTarget = settings.autoQueueTarget + settings.autoClimbStep
        if (newTarget > settings.autoClimbMax) {
          settings.autoQueueTarget = settings.autoClimbMin
        } else {
          settings.autoQueueTarget = newTarget
        }
        console.log('[AutoStep] Change tempo target', prev, '->', settings.autoQueueTarget)
      }
    })

    // Trigges 10 sec before playback end
    const switchSong = useThrottleFn(async () => {
      console.log('[Player] Starting song switch')

      // If queueing is enabled set next song
      if (settings.autoQueueEnabled) {
        if (queue.track) {
          console.log('[Queue] Add track to queue:', queue.track.title, queue.track.bpm)
          await client.queue(`spotify:track:${queue.track.id}`, dev.value)
          queue.sent = true
        } else {
          console.warn('[Queue] No track in queue to play')
        }
      }

      // Fade duration
      const duration = 5000
      console.log('[Player] Waiting for song end...')
      await sleep(10000 - duration)

      console.log('[Player] Starting fade down', volume.value)
      const currentVolume = volume.value
      await startFadeDown(currentVolume, duration, dev.value)

      console.log('[Player] Skipping to next track')
      await player.nextTrack(dev.value)

      let retires = 0
      const expected = queue.track?.id
      while (true) {
        const current = state.value?.item?.id
        if (current === expected) {
          break
        }
        await sleep(500)
        retires++
        if (retires > 14) {
          console.warn('[Queue] Song was not correct!', { current, expected })
          break
        }
      }
      queue.sent = false

      await startFadeUp(currentVolume, duration, dev.value)
    }, 15000)

    // Exectute playback seconds changes
    watch(() => state.value?.progress_ms, (progress_ms) => {
      if (!progress_ms && progress_ms !== 0) return

      if (settings.timeLimitEnabled && passed(progress_ms, secondsMax.value - 10)) {
        switchSong()
      }
    })

    async function play (context_uri?: string) {
      if (context_uri && typeof context_uri === 'string') {
        await client.play({ context_uri, ...dev.value })
        try {
          await client.setShuffle(true, dev.value)
        } catch (e) {
          for (let i = 0; i < 10; i++) {
            await sleep(500)
            if (!playback.value?.device.is_restricted) {
              try {
                await client.setShuffle(true, dev.value)
                await sleep(100)
                break
              } catch (e) {}
            }
          }
        }
      } else if (state.value && state.value.is_playing) {
        await player.pause(dev.value)
      } else {
        await player.resume(dev.value)
      }
    }

    async function playNext () {
      if (settings.autoQueueEnabled && queue.track && !queue.sent) {
        await playTrack(queue.track)
      } else {
        await player.nextTrack(dev.value)
      }
    }

    async function playPrev () {
      await player.previousTrack(dev.value)
    }

    async function playAgain () {
      await client.seek(0, dev.value)
    }

    async function playTrack (track: TrackWithBPM) {
      settings.timeLimitEnabled = false
      settings.autoFadeEnabled = false
      queue.track = track

      console.log('[Skip]: Queuing: ', track.title)
      await client.queue(`spotify:track:${track.id}`, dev.value)
      queue.sent = true

      computeNextTrack(playlist.value, settings.autoQueueTarget, settings.autoQueueRange)

      console.log('[Skip]: Fade out!')
      const vol = playback.value?.device.volume_percent ?? 0.5
      await startFadeDown(vol, 3000, dev.value)

      console.log('[Skip]: Skipping to queued item!')
      await player.nextTrack(dev.value)

      console.log('[Skip]: Fade in!')
      await startFadeUp(vol, 5000, dev.value)

      settings.autoFadeEnabled = true
      settings.timeLimitEnabled = true
    }

    async function playHere () {
      if (devices.thisDevice.value) {
        await client.transferMyPlayback([devices.thisDevice.value.id ?? ''])
      }
    }

    async function updateTrackInfo ({ id, bpm }: TrackWithBPM) {
      await tracks.updateTrackInfo(id, { bpm } as TrackWithBPM)
      current.value = await tracks.getTrackWithTempo(id)
    }

    useHotKeys($root, {
      space: () => play(),
      keyn: () => playNext(),
      keyp: () => playPrev(),
      keyr: () => playAgain(),
      home: () => setVolumeDelta(20),
      pageup: () => setVolumeDelta(5),
      end: () => setVolumeDelta(0 - 20),
      pagedown: () => setVolumeDelta(0 - 5)
    })

    const { playlists: presets } = usePresets()

    return {
      name,
      ...clock,
      ...devices,
      secondsPlayed,
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
      playAgain,
      playTrack,
      playHere,
      playlist,
      context,
      queue,
      current,
      playback,
      fading,
      isCurrentWithinRange,
      setVolumeDelta,
      updateTrackInfo,
      canEdit: computed(() => !!userState.id),
      presets,
      volume
    }
  }
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
    .control-buttons {
      .btn {
        padding-top: 0;
        padding-bottom: 0;
        &.again {
          padding-right: 0;
        }
      }
    }
    .image {
      margin-top: 10px;
    }
    .seconds {
      user-select: none;
      background: #1b5894;
    }
    .seconds-left {
      user-select: none;
      font-size: 2em;
    }

    .bpm {
      font-size: 7em;
      line-height: 1em;
      text-align: center;
      user-select: none;

      &.warntempo {
        animation: pulse-animation 2s infinite;
        color: rgb(190, 146, 0);
      }

      @keyframes pulse-animation {
        0% {
          opacity: 0.7;
        }
        50% {
          opacity: 0;
        }
        100% {
          opacity: 0.7;
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
