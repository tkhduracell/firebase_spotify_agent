import { computed, onMounted, onUnmounted, ref } from '@vue/composition-api'
import { useInterval } from 'vue-composable'
import { SpotifyApi } from './types'

export function usePlaybackState (client: SpotifyApi, rate = 1000) {
  const state = ref<SpotifyApi.CurrentlyPlayingResponse>()
  const playback = ref<SpotifyApi.CurrentPlaybackResponse>()

  const { start: startUpdateState, remove: stopUpdateState } = useInterval(async () => {
    if (client.getAccessToken()) {
      try {
        const res = (await client.getMyCurrentPlayingTrack()) as '' | SpotifyApi.CurrentlyPlayingResponse
        state.value = res === '' ? undefined : res
        playback.value = await client.getMyCurrentPlaybackState()
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

  return { state, playback, secondsPlayed, secondsTotal }
}
