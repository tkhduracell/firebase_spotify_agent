import { useSpotifyState } from './state'
import { onMounted, onUnmounted, watch } from '@vue/composition-api'
import { SpotifyPlayer } from 'spotify-web-playback-ts'

const NAME = 'Spotify Agent'

export function usePlayerReady (el: Element) {
  const state = useSpotifyState()

  watch(() => ({ token: state.token, player: state.player }), async ({ player, token }) => {
    if (token?.access_token && !token.expierd() && player) {
      console.log('Connecting player...')
      await player.connect()
    }
  })

  onMounted(async () => {
    const player: SpotifyPlayer = await SpotifyPlayer.init(el.ownerDocument, NAME, 0.5, async (cb: (token:string) => void) => {
      cb(state.token?.access_token ?? '')
    })
    state.player = player
  })
  onUnmounted(() => {
    if (state.player) {
      console.log('Disconnecting player...')
      state.player.disconnect()
    }
  })
}
