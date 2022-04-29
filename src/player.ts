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
    state.player_sdk = player_sdk
    player_sdk.onPlayerStateChanged(s => {
      player_sdk.getVolume().then(v => console.log('onPlayerStateChanged: volume=', v))
    })
  })

  onUnmounted(() => {
    if (state.player_sdk) {
      console.log('Disconnecting player...')
      state.player_sdk.disconnect()
    }
  })
}

export function usePlayer () {
  const { client } = useSpotifyClient()
  const state = useSpotifyState()

  const player = new SpotifyPlayerProxy(client)

  watch(() => state.player_sdk, (sdk) => {
    player.setPlayer(sdk)
  })

  return { player }
}
