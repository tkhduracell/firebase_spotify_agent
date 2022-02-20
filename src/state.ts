import { reactive } from '@vue/composition-api'
import { createGlobalState } from '@vueuse/core'
import { SpotifyPlayer } from 'spotify-web-playback-ts'
import { SpotifyPlayerState } from 'spotify-web-playback-ts/lib/types'
import { SpotifyToken } from './auth'

export type SpotifyState = {
  id: string,
  name: string,
  token: SpotifyToken | null,
  device_id: string | null,
  player: SpotifyPlayer | null,
  player_state: SpotifyPlayerState | null
}

export const useSpotifyState = createGlobalState<SpotifyState>(() => reactive({
  id: '',
  name: '',
  token: null,
  device_id: '',
  player: null,
  player_state: null
}))

export type UserState = {
  id: string,
  name: string,
}

export const useUserState = createGlobalState<UserState>(() => reactive({
  id: '',
  name: ''
}))
