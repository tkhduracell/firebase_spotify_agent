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

          <b-row align-v="center" align-h="center" class="device mb-3"  v-if="playback.device">
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
            :volume="playback.device.volume_percent || 0"
            :is-fading="fading.fadedown || fading.fadeup"
            @update:volume="updateVolume"
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
    <b-row v-else>
      <b-col class="mt-4" offset="3" cols="6">
        <StartSceen
          :presets="presets"
          :devices="devices ? devices.devices : undefined"
          @play="play($event.id, $event.device)"
          @devices:reload="loadDevices"
        />
      </b-col>
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

import { TrackWithBPM, TrackDatabase, trackFormat } from '@/tracks'
import { PlaylistDatabase } from '@/playlists'
import { useClock } from '@/clock'
import { useDevices } from '@/devices'
import { useVolume } from '@/volume'
import { QueueState, SpotifyApi } from '@/types'
import { useHotKeys } from '@/hotkeys'
import { usePresets } from '@/presets'
import { useUserState } from '@/state'
import { useSpotifyAuth, useSpotifyClient } from '@/auth'
import { usePlaybackState } from '@/playing'
import { sleep } from '@/sleep'

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
  name: 'Home',
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
  setup (props, { root: { $root, $route } }) {
    const userState = useUserState()
    const { reauth } = useSpotifyAuth($route, false)

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
      autoClimbMax: 180,
      autoClimbStep: 5
    })

    const { client } = useSpotifyClient()

    const clock = useClock()
    const devices = useDevices(client)
    const { startFadeDown, startFadeUp, fading } = useVolume(client)

    const playlists = new PlaylistDatabase(client)
    const tracks = new TrackDatabase(client)

    function devOpts () {
      return playback.value?.device?.id ? { device_id: playback.value.device.id } : {}
    }

    const { state, playback, secondsPlayed, secondsTotal } = usePlaybackState(client, reauth)

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
          if (settings.autoQueueEnabled && queue.track && queue.track?.id !== id && queue.sent) {
            console.warn(
              '[Queue] New played item was not as queued, expected: \n',
              `${queue.track.title} (${queue.track.id})`,
              'got:\n',
              `${item.name} (${item.id})\n`,
              'Skipping to next!'
            )
            await client.skipToNext(devOpts())
          }
          queue.sent = false
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

    watch(
      [playlist, current, toRef(settings, 'autoQueueTarget'), toRef(settings, 'autoQueueRange'), toRef(settings, 'autoQueueEnabled')],
      async source => {
        const [p, , target, range, enabled] = source as [TrackWithBPM[], TrackWithBPM, number, number, boolean]
        if (enabled && p.length > 0) {
          queue.loading = true
          const matching = p.filter(t => isWithin(t.bpm, target, target + range))
          queue.pool = matching.length

          if (matching.length > 0) {
            queue.track = getRandomUnplayed(matching)
            console.log('[Queue] Computed track for queuing', queue.track?.title, queue.track?.bpm)
          } else {
            console.warn('[Queue] No track to queue given', target, '⌥', range)
          }
          queue.loading = false
        } else {
          queue.track = undefined
        }
      }
    )

    function passed (cpr: SpotifyApi.CurrentlyPlayingResponse, seconds: number) {
      return (cpr.progress_ms ?? 0) > seconds * 1000
    }

    watch(state, async s => {
      if (!s) return

      if (settings.timeLimitEnabled && passed(s, settings.timeLimitSeconds)) {
        console.log('[Skip] Skipping to next song')
        await client.skipToNext(devOpts())
        setTimeout(() => {
          // Execute auto-step
          if (settings.autoQueueEnabled && settings.autoClimbEnabled) {
            const newTarget = settings.autoQueueTarget + settings.autoClimbStep
            if (newTarget > settings.autoClimbMax) {
              settings.autoQueueTarget = settings.autoClimbMin
            } else {
              settings.autoQueueTarget = newTarget
            }
          }
        }, 2000)
      }

      if (settings.autoQueueEnabled && passed(s, secondsMax.value - 10)) {
        if (queue.track && !queue.sent) {
          console.log('[Queue] Add track to queue:', queue.track.title, queue.track.bpm)
          await client.queue(`spotify:track:${queue.track.id}`, devOpts())
          queue.sent = true
        }
      }

      if (settings.autoFadeEnabled && passed(s, secondsMax.value - 3)) {
        startFadeDown(playback.value?.device.volume_percent ?? undefined, devOpts())
      }

      if (settings.autoFadeEnabled && !passed(s, 4)) {
        startFadeUp(devOpts())
      }
    })

    async function play (context_uri?: string, device?: SpotifyApi.UserDevice) {
      const dev = device && device.id ? { device_id: device.id } : {}
      if (context_uri && typeof context_uri === 'string') {
        await client.play({ context_uri, ...dev })
        try {
          await client.setShuffle(true, { ...dev })
        } catch (e) {
          for (let i = 0; i < 10; i++) {
            await sleep(500)
            if (!playback.value?.device.is_restricted) {
              try {
                await client.setShuffle(true, { ...dev })
                await sleep(100)
                break
              } catch (e) {}
            }
          }
        }
      } else if (state.value && state.value.is_playing) {
        await client.pause({ ...dev })
      } else {
        await client.play({ ...dev })
      }
    }

    async function playNext () {
      if (settings.autoQueueEnabled && queue.track && !queue.sent) {
        await playTrack(queue.track)
      } else {
        await client.skipToNext(devOpts())
      }
    }

    async function playPrev () {
      await client.skipToPrevious(devOpts())
    }

    async function playAgain () {
      await client.seek(0, devOpts())
    }

    async function playTrack (track: TrackWithBPM) {
      settings.timeLimitEnabled = false
      settings.autoFadeEnabled = false

      console.log('[Skip]: Queuing: ', track.title)
      await client.queue(`spotify:track:${track.id}`, devOpts())
      queue.sent = true

      console.log('[Skip]: Fade out!')
      await startFadeDown(playback.value?.device.volume_percent ?? undefined, devOpts())

      console.log('[Skip]: Skipping to queued item!')
      await client.skipToNext(devOpts())

      settings.autoFadeEnabled = true
      settings.timeLimitEnabled = true
    }

    async function updateVolume (vol: number) {
      if (vol !== null && vol !== undefined) {
        await client.setVolume(Math.max(0, Math.min(100, vol)), devOpts())
      }
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
      home: () => updateVolume((playback.value?.device.volume_percent ?? 0) + 20),
      pageup: () => updateVolume((playback.value?.device.volume_percent ?? 0) + 5),
      end: () => updateVolume((playback.value?.device.volume_percent ?? 0) - 20),
      pagedown: () => updateVolume((playback.value?.device.volume_percent ?? 0) - 5)
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
      updateVolume,
      updateTrackInfo,
      canEdit: computed(() => !!userState.id),
      presets
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
