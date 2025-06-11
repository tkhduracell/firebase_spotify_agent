<template lang="html">
  <b-container fluid="lg" class="home">
    <b-row v-if="state && state.item" class="state" align-v="stretch">
      <b-col cols-sm="12" cols-md="12" cols-lg="7" align-self="center">
        <div v-if="current && current.bpm" :class="['bpm', isCurrentWithinRange ? '' : 'warntempo']">{{ current.bpm.toFixed() }} BPM</div>
        <div class="header">
          <div class="clearfix">
            <h1 v-if="current">
              {{ trackFormat(current) }}
              <div v-b-modal.trackedit class="d-inline-block" v-if="canEdit">
                <b-icon-pencil-fill scale="0.5" />
              </div>
              <b-button variant="link" @click="doubleTempo(current.id)" v-if="canEdit">
                x2
              </b-button>
            </h1>
          </div>

          <b-row align-v="center" align-h="center">
            <b-col cols="auto" class="d-block d-lg-none">
              <PlaylistSelector :context="context" v-if="context" @play="play($event)" />
            </b-col>
            <b-col cols="auto">
              <HelpfulButton class="d-inline-block" @click="playAgain">
                <b-icon-arrow-counterclockwise scale="2.0" class="mt-4 mb-4" />
              </HelpfulButton>

              <HelpfulButton class="d-inline-block" @click="playPrev">
                <b-icon-skip-forward-circle scale="2.0" class="mt-4 mb-4" />
              </HelpfulButton>

              <b-button variant="link" @click="play" v-if="state.is_playing">
                <b-icon-pause scale="3.0" class="mt-4 mb-4" />
              </b-button>
              <b-button variant="link" @click="play" v-else>
                <b-icon-play scale="3.0" class="mt-4 mb-4" />
              </b-button>

              <HelpfulButton class="d-inline-block" @click="playNext">
                <b-icon-skip-backward-circle scale="2.0" class="mt-4 mb-4" />
              </HelpfulButton>
            </b-col>
            <b-col cols="auto"
              ><span class="seconds-left"> {{ seconds.toFixed() }} / {{ secondsMax.toFixed() }} seconds </span>
            </b-col>
          </b-row>

          <b-progress height="2rem" :max="secondsMax" class="mb-3 seconds">
            <b-progress-bar :value="seconds" :label="progressLabel"></b-progress-bar>
          </b-progress>
        </div>

        <b-overlay :show="fading.fadedown || fading.fadeup" rounded="sm" variant="dark">
          <PlaybackLimiter
            :enabled="settings.timeLimitEnabled"
            @update:enabled="settings.timeLimitEnabled = $event"
            :value="settings.timeLimitSeconds"
            @update:value="settings.timeLimitSeconds = $event"
            :progress="seconds"
            class="mb-2"
          />
          <PlaybackAutoFade
            :enabled="settings.autoFadeEnabled"
            @update:enabled="settings.autoFadeEnabled = $event"
            :volume="activeDevice.volume_percent"
            v-if="activeDevice && activeDevice.supports_volume"
            :is-fading="fading.fadedown || fading.fadeup"
            @update:volume="updateVolume"
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
            <b class="d-block">Last {{ historyItems.length }} played items</b>
            <div class="text-truncate" v-for="(l, idx) in historyItems.slice(0, 5)" :key="'h-' + l.id + '-' + idx" v-text="trackFormat(l, true)" >

            </div>
            <div v-if="historyItems.length === 0">
              None so far...
            </div>
            <div class="mt-2" v-if="queue2">
              <b class="d-block mt-2">Playlist queue</b>
              <div class="text-truncate" v-for="item in queue2.queue.slice(0, 5)" :key="'q-' + item.id" >
                {{ trackFormat(item, true) }}
              </div>
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
    <b-row v-else-if="state && !state.is_playing" align-h="center">
      <h1>Not playing</h1>
      <p>Play something with you spotify client.</p>
      <b>Try this:</b>
      <b-button variant="outline-primary" @click="play('spotify:playlist:00968xdUCWZgRHZqepn8IQ')">
        <b-icon-play />
        Bugg MASTER
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
          :presets="presets"
          :devices="devices"
          @play="play($event.id, $event.device)"
          @devices:reload="reloadDevices"
        />
      </b-col>
    </b-row>

    <div class="clock">
      {{ hhmm }}
    </div>
    <EditModal v-if="current" :track="current"
      @update:track="updateTrackInfo" @skip:track="playNext" />
  </b-container>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, toRef, watch } from '@vue/composition-api'

import PlaybackLimiter from '@/components/PlaybackLimiter.vue'
import PlaybackAutoQueuer from '@/components/PlaybackAutoQueuer.vue'
import PlaybackAutoClimb from '@/components/PlaybackAutoClimb.vue'
import PlaybackAutoFade from '@/components/PlaybackAutoFade.vue'
import PlaylistSelector from '@/components/PlaylistSelector.vue'
import HelpContent from '@/components/HelpContent.vue'
import NextUp from '@/components/NextUp.vue'
import EditModal from '@/components/EditModal.vue'
import HelpfulButton from '@/components/HelpfulButton.vue'

import { TrackWithBPM, TrackDatabase } from '@/tracks'
import { PlaylistDatabase } from '@/playlists'
import { useSpotifyRedirect, useSpotifyUser, SpotifyApi /* This is used! */ } from '@/auth'
import { useClock } from '@/clock'
import { useDevices } from '@/devices'
import { useVolume } from '@/volume'
import { QueueState } from '@/types'
import { useUser } from '@/firebase'
import { useHotKeys } from '@/hotkeys'
import { usePresets } from '@/presets'
import { useThrottleFn } from '@vueuse/core'
import { useQueue } from '@/queue'

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
    HelpContent,
    NextUp,
    EditModal,
    HelpfulButton
  },
  setup (props, { root: { $root, $route } }) {
    const state = ref<SpotifyApi.CurrentlyPlayingResponse>()
    const historyItems = ref<TrackWithBPM[]>([])
    const context = ref<SpotifyApi.PlaylistObjectSimplified>()
    const playlist = ref<TrackWithBPM[]>([])
    const current = ref<TrackWithBPM>()
    const error = ref<SpotifyApi.ErrorObject>()
    const ready = ref(false)

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

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const { client } = useSpotifyRedirect($route, start, update)
    const clock = useClock()
    const { devices, activeDevice, reloadDevices } = useDevices(client)
    const { startFadeDown, startFadeUp, fading } = useVolume(client)

    const playlists = new PlaylistDatabase(client)
    const tracks = new TrackDatabase(client)
    const { queue: queue2, reloadQueue } = useQueue(client, tracks)

    function trackFormat (track: { artist: string, title: string, bpm: number }, showBPM = false): string {
      const prefix = showBPM && track.bpm ? track.bpm.toFixed() + ' bpm - ' : ''
      return `${prefix}${track.artist} - ${track.title}`
    }

    function devOpts () {
      const device_id = state.value?.device?.id ?? undefined
      return device_id ? { device_id } : {}
    }

    function hasVolumeSupport () {
      const active = activeDevice.value
      if (active) {
        return active.supports_volume
      }
      return false
    }

    async function start () {
      ready.value = true
    }

    async function update () {
      try {
        const res = await client.getMyCurrentPlayingTrack()
        state.value = res
      } catch (err) {
        console.error('Unable to get current play state', err)
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
          historyItems.value = [await tracks.getTrackWithTempo(item.id), ...historyItems.value].slice(0, 12)
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

          playlist.value = await tracks.getTracksWithTempo(await playlists.getPlaylistTracks(id, playlistProgress), trackProgress)
          queue.loading = false
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

    const switchSong = useThrottleFn(async () => {
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
    }, 20000, false, true)

    watch(state, async s => {
      if (!s) return

      if (settings.timeLimitEnabled && passed(s, settings.timeLimitSeconds)) {
        await switchSong()
      }

      if (settings.autoQueueEnabled && passed(s, secondsMax.value - 10)) {
        if (queue.track && !queue.sent) {
          console.log('[Queue] Add track to queue:', queue.track.title, queue.track.bpm)
          await client.queue(`spotify:track:${queue.track.id}`, devOpts())
          setTimeout(reloadQueue, 1000)
          queue.sent = true
        }
      }

      if (settings.autoFadeEnabled && passed(s, secondsMax.value - 3)) {
        const currentVolume = activeDevice.value?.volume_percent
        if (currentVolume !== undefined && currentVolume !== null) {
          await startFadeDown(currentVolume, devOpts())
        } else {
          console.warn('Unable to fade down, no volume support for device', activeDevice.value?.id)
        }
      }

      if (settings.autoFadeEnabled && !passed(s, 4)) {
        await startFadeUp(devOpts())
      }
    })

    async function play (context_uri?: string, device?: SpotifyApi.UserDevice) {
      if (context_uri && typeof context_uri === 'string') {
        const dev = device && device.id ? { device_id: device.id } : {}
        await client.play({ context_uri, ...dev })
        await client.setShuffle(true, { ...dev })
      } else if (state.value && state.value.is_playing) {
        await client.pause()
      } else {
        await client.play()
      }
    }

    async function playNext () {
      try {
        if (settings.autoQueueEnabled && queue.track && !queue.sent) {
          settings.timeLimitEnabled = false
          settings.autoFadeEnabled = false

          console.log('[Skip]: Queuing: ', queue.track.title)
          try {
            await client.queue(`spotify:track:${queue.track.id}`, devOpts())
          } catch (e) {
            if (e instanceof SyntaxError) {
              // Ignore expected, due to old library
              queue.sent = true
            } else {
              console.error('Unable to queue track', queue.track.title, e)
              return
            }
          }

          console.log('[Skip]: Fade out!')
          const currentVolume = activeDevice.value?.volume_percent
          if (currentVolume !== undefined && currentVolume !== null) {
            await startFadeDown(currentVolume, devOpts())
          } else {
            console.warn('Unable to fade down, no volume support for device', activeDevice.value?.id)
          }

          console.log('[Skip]: Skipping to queued item!')
          try {
            await client.skipToNext(devOpts())
          } catch (e) {
            if (e instanceof SyntaxError) {
              // Ignore expected, due to old library
            } else {
              console.error('Unable to skip to next song', e)
            }
          }

          settings.autoFadeEnabled = true
          settings.timeLimitEnabled = true
        } else {
          try {
            await client.skipToNext(devOpts())
          } catch (e) {
            if (e instanceof SyntaxError) {
              // Ignore expected, due to old library
            } else {
              console.error('Unable to skip to next song', e)
            }
          }
        }
      } catch (e) {
        console.error('Unable to play next song', e)
      }
    }

    async function playPrev () {
      try {
        await client.skipToPrevious(devOpts())
      } catch (e) {
        if (e instanceof SyntaxError) {
          // Ignore expected, due to old library
        } else {
          console.error('Unable to skip to previous song', e)
        }
      }
    }

    async function playAgain () {
      await client.seek(0, devOpts())
    }

    async function updateVolume (vol: number) {
      if (vol !== null && vol !== undefined) {
        if (activeDevice.value) {
          activeDevice.value.volume_percent = Math.max(0, Math.min(100, vol))
        }
        await client.setVolume(Math.max(0, Math.min(100, vol)), devOpts())
        await reloadDevices()
      }
    }

    async function updateTrackInfo ({ id, bpm }: TrackWithBPM) {
      await tracks.updateTrackInfo(id, { bpm } as TrackWithBPM)
      current.value = await tracks.getTrackWithTempo(id)
    }

    const user = useUser()

    useSpotifyUser(client)

    useHotKeys($root, {
      space: () => play(),
      keyn: () => playNext(),
      keyp: () => playPrev(),
      keyr: () => playAgain(),
      home: () => updateVolume((state.value?.device.volume_percent ?? 0) + 20),
      pageup: () => updateVolume((state.value?.device.volume_percent ?? 0) + 5),
      end: () => updateVolume((state.value?.device.volume_percent ?? 0) - 20),
      pagedown: () => updateVolume((state.value?.device.volume_percent ?? 0) - 5)
    })

    async function doubleTempo (id: string) {
      const old = current.value?.bpm ?? 0
      const newBPM = Math.round(old * 2)
      if (old === 0 || newBPM > 240) {
        console.warn('New BPM is too high, not updating', newBPM)
        return
      }
      current.value = { ...current.value, bpm: newBPM } as TrackWithBPM
      await tracks.updateTrackInfo(id, { bpm: newBPM } as TrackWithBPM)
    }

    const { playlists: presets } = usePresets(client, ready)

    return {
      name,
      ...clock,
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
      playAgain,
      playlist,
      context,
      queue,
      current,
      fading,
      isCurrentWithinRange,
      updateVolume,
      updateTrackInfo,
      canEdit: computed(() => !!user.id),
      presets,
      hasVolumeSupport,
      devices,
      activeDevice,
      reloadDevices,
      queue2,
      doubleTempo
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
    .image {
      margin-top: 10px;
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
        color: rgb(190, 146, 0);
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
