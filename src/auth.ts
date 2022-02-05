import { SpotifyApi } from './types'
import { useSpotifyState } from './state'
import { onMounted, watch } from '@vue/composition-api'
import { Route } from 'vue-router'

export function useSpotifyAuth (
  $route: Route,
  watchProfile = false,
  scopes = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-read-recently-played',
    'playlist-read-collaborative',
    'playlist-read-private',
    'playlist-modify-private',
    'streaming'
  ]
) {
  const authUrl = createAuthUrl(document.location, scopes)
  const state = useSpotifyState()

  onMounted(async () => {
    if (state.token) return
    const token = getToken($route.hash)
    if (!token) {
      reauth()
    }
    state.token = token ?? ''
  })

  function reauth () {
    document.location = authUrl
  }

  if (watchProfile) {
    watch(() => state.token, async (t) => {
      const client = new SpotifyApi()
      client.setAccessToken(t)
      const { display_name, id } = await client.getMe()
      state.id = id ?? ''
      state.name = display_name ?? ''
    })
  }

  return { reauth }
}

export function useSpotifyClient () {
  const client = new SpotifyApi()
  const state = useSpotifyState()

  watch(() => state.token, (t) => {
    if (t) {
      console.log('setting token!')
      client.setAccessToken(t)
    }
  })

  return { client }
}

function createAuthUrl (to: Location, scopes: string[]) {
  const url = new URL('https://accounts.spotify.com/authorize')
  url.searchParams.append('client_id', '2c23b47cf7274b24b1a34382a32ac94b')
  url.searchParams.append('response_type', 'token')
  url.searchParams.append(
    'redirect_uri',
    `${to.protocol}//${to.hostname}${to.port ? ':' + to.port : ''}${to.pathname}`
  )
  url.searchParams.append('scope', scopes.join(','))
  return (url.toString() as unknown) as Location
}

function getToken (hash: string): string | null {
  if (hash.includes('access_token')) {
    const params = new URLSearchParams(hash.replace(/^#/gim, ''))
    return params.get('access_token')
  } else {
    return null
  }
}
