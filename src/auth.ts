import { SpotifyApi } from './types'
import { useSpotifyState } from './state'
import { onMounted, watch } from '@vue/composition-api'
import VueRouter, { Route } from 'vue-router'
import { useInterval } from 'vue-composable'

export type SpotifyTokenResponse = { access_token: string, expires_in: string, page: string, refresh_token: string, scope: string, token_type: string }
export type SpotifyTokenRefreshResponse = { access_token: string, expires_in: number, scope: string, token_type: 'Bearer' }

export class SpotifyToken {
  access_token!: string
  expires_in!: number
  expires_at!: number
  refresh_token!: string
  scope!: string
  token_type!: string

  constructor (data: SpotifyTokenResponse) {
    const { access_token, refresh_token, scope, token_type } = data
    const expires_in = parseInt(data.expires_in) * 1000
    const expires_at = new Date().getTime() + expires_in
    Object.assign(this, { access_token, expires_in, refresh_token, scope, token_type, expires_at })
  }

  expierd (marginMs = 0) { return new Date().getTime() + marginMs >= this.expires_at }

  refresh (data: SpotifyTokenRefreshResponse) {
    this.access_token = data.access_token
    this.expires_in = data.expires_in * 1000
    this.expires_at = new Date().getTime() + this.expires_in
    return this
  }
}

export function useSpotifyAuth ($router: VueRouter) {
  const state = useSpotifyState()
  const { VUE_APP_AUTH_SERVER_URL: auth_url } = process.env

  onMounted(authStateChanged)
  useInterval(authStateChanged, 10000)

  async function authStateChanged () {
    if (!state.token && !['Login', 'Callback', 'Start'].includes($router.currentRoute.name ?? '')) {
      console.log('Move to Login', $router.currentRoute)
      $router.push({ name: 'Login' })
    }
    if (state.token && state.token.expierd(15 * 1000)) {
      console.log('Refreshing auth token...')
      const result = await fetch(auth_url + '/refresh_token?refresh_token=' + state.token.refresh_token)
      if (result.ok) {
        const token = await result.json() as unknown as SpotifyTokenRefreshResponse
        state.token = state.token.refresh(token)
        console.log('Successfully refreshed auth token!')
      }
    }
  }

  watch(() => state.token, async (t) => {
    if (!t?.access_token || t.expierd()) return
    const client = new SpotifyApi()
    client.setAccessToken(t.access_token)
    try {
      const { display_name, id } = await client.getMe()
      state.id = id ?? ''
      state.name = display_name ?? ''
    } catch (e) {
      if (e instanceof XMLHttpRequest && e.status === 401) {
        debugger
      }
    }
  })

  return { }
}

export function useSpotifyClient () {
  const client = new SpotifyApi()
  const state = useSpotifyState()

  watch(() => state.token, (t) => {
    if (t?.access_token && !t.expierd()) {
      console.log('Setting token for client!')
      client.setAccessToken(t.access_token)
    }
  })

  return { client }
}
