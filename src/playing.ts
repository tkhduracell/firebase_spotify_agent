import { computed, onMounted, onUnmounted, ref } from '@vue/composition-api'
import { controlledComputed, useThrottleFn } from '@vueuse/core'
import { useInterval } from 'vue-composable'
import { SpotifyApi } from './types'

export function usePlaybackState (client: SpotifyApi, rate = 1000) {
  const state = ref<SpotifyApi.CurrentlyPlayingResponse>()
  const playback = ref<SpotifyApi.CurrentPlaybackResponse>()
  const volume = ref<number>(0.5)

  function setVolume (vol: number) {
    volume.value = vol
  }

  const setVolumeThrottled = useThrottleFn(setVolume, 2000, true, true)

  const { start: startUpdateState, remove: stopUpdateState } = useInterval(async () => {
    if (client.getAccessToken()) {
      try {
        const [playingTrackResult, playbackStateResult] = await Promise.allSettled([
          client.getMyCurrentPlayingTrack(),
          client.getMyCurrentPlaybackState()
        ])
        if (playingTrackResult.status === 'fulfilled') {
          state.value = playingTrackResult.value
        }
        if (playbackStateResult.status === 'fulfilled') {
          playback.value = playbackStateResult.value
          const vol = playbackStateResult.value?.device?.volume_percent
          if (vol) {
            volume.value = vol
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
  }, rate)
  onMounted(startUpdateState)
  onUnmounted(stopUpdateState)

  const secondsPlayed = computed(() => {
    return state.value ? (state.value.progress_ms ?? 0) / 1000 : 0
  })
  const secondsTotal = computed(() => {
    return state.value ? (state.value.item?.duration_ms ?? 0) / 1000 : 0
  })

  return { state, playback, volume, secondsPlayed, secondsTotal, setVolume, setVolumeThrottled }
}
