import { useSpotifyState } from './state'
import { onMounted, onUnmounted, watch } from '@vue/composition-api'
import { SpotifyPlayer as SpotifyPlayerSDK } from 'spotify-web-playback-ts'
import { useSpotifyClient } from './auth'
import { SpotifyPlayerProxy } from './player-proxy'

const NAME = 'Spotify Agent'

export function usePlayerReady (el: Element) {
  const state = useSpotifyState()

  watch(() => ({ token: state.token, player_sdk: state.player_sdk }), async ({ player_sdk, token }) => {
    if (token?.access_token && !token.expierd() && player_sdk) {
      console.log('Connecting player...')
      await player_sdk.connect()
    }
  })

  onMounted(async () => {
    const player_sdk: SpotifyPlayerSDK = await SpotifyPlayerSDK.init(el.ownerDocument, NAME, 0.5, async (cb: (token:string) => void) => {
      cb(state.token?.access_token ?? '')
    })
    console.log('Player connected', player_sdk)
    state.player_sdk = player_sdk
    player_sdk.onPlayerStateChanged(s => {
      const { paused, position, track_window: { current_track: { name }, next_tracks: [{ name: next_name }, ...rest] } } = s
      console.debug('onPlayerStateChanged', { name, paused, position, next_name })
      state.player_sdk = player_sdk
    })
  })

  onUnmounted(() => {
    if (state.player_sdk) {
      console.log('Disconnecting player...')
      state.player_sdk.disconnect()
      state.player_sdk = null
    }
  })
}

export function usePlayer () {
  const { client } = useSpotifyClient()
  const state = useSpotifyState()

  const player = new SpotifyPlayerProxy(client)

  onMounted(() => player.setPlayer(state.player_sdk))

  watch(() => state.player_sdk, sdk => player.setPlayer(sdk))

  return { player }
}
