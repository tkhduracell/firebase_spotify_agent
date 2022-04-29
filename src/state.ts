import { reactive } from '@vue/composition-api'
import { createGlobalState } from '@vueuse/core'
import { SpotifyPlayer as SpotifyPlayerSDK } from 'spotify-web-playback-ts'
import { SpotifyPlayerState } from 'spotify-web-playback-ts/lib/types'
import { SpotifyToken } from './auth'
import { SpotifyPlayerProxy } from './player-proxy'

export type SpotifyState = {
  id: string,
  name: string,
  token: SpotifyToken | null,
  device_id: string | null,
  player_sdk: SpotifyPlayerSDK | null,
  player_state: SpotifyPlayerState | null,
  player: SpotifyPlayerProxy | null
}

export const useSpotifyState = createGlobalState<SpotifyState>(() => reactive({
  id: '',
  name: '',
  token: null,
  device_id: '',
  player_sdk: null,
  player_state: null,
  player: null
}))

export type UserState = {
  id: string,
  name: string,
}

export const useUserState = createGlobalState<UserState>(() => reactive({
  id: '',
  name: ''
}))
