import { useSpotifyState } from './state'
import { onMounted, onUnmounted } from '@vue/composition-api'
import { SpotifyPlayer } from 'spotify-web-playback-ts'

const NAME = 'Spotify Agent'

export function usePlayerReady (el: Element) {
  const state = useSpotifyState()

  onMounted(async () => {
    const player: SpotifyPlayer = await SpotifyPlayer.init(el.ownerDocument, NAME, 0.5, cb => cb(state.token))
    await player.connect()
    state.player = player
  })
  onUnmounted(() => {
    if (state.player) {
      state.player.disconnect()
    }
  })
}
