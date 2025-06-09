import { onMounted, onUnmounted, reactive, ref } from '@vue/composition-api'
import { createGlobalState } from '@vueuse/core'
import SpotifyWebApi from 'spotify-web-api-js'
import { useInterval } from 'vue-composable'
import { Route } from 'vue-router'

export function useSpotifyRedirect (
  $route: Route,
  onInit?: () => unknown,
  onRefresh?: () => unknown,
  scopes = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-read-recently-played'
  ]
) {
  const client = new SpotifyWebApi()

  const location = document.location
  const params = {
    client_id: '2c23b47cf7274b24b1a34382a32ac94b',
    redirect_uri: `${location.protocol}//${location.hostname}${location.port ? ':' + location.port : ''}${location.pathname}`
  }

  const { start, remove } = useInterval(onRefresh ? () => onRefresh() : () => null, 2000)

  const ready = ref(false)

  onUnmounted(() => {
    ready.value = true
    remove()
  })

  onMounted(async () => {
    if (sessionStorage.getItem('spotify_token')) {
      const token = sessionStorage.getItem('spotify_token')
      const expires = new Date(sessionStorage.getItem('spotify_token_expires') ?? '')
      if (token && expires > new Date()) {
        console.log('Using existing token from session storage', { expires })
        client.setAccessToken(token)
        ready.value = true
        if (onInit) {
          await onInit()
        }
        start()
        return
      } else {
        console.log('Token expired or not found, redirecting...')
      }
    }
    const hash = $route.query
    if ('code' in hash) {
      const code = hash.code as string
      console.log('Got code', code)
      const token = await getToken(code)
      if (!token) {
        console.log('No token')
        return await doRedirect()
      }
      location.replace(location.toString().split('?')[0]) // Clear the URL
    } else {
      return await doRedirect()
    }
  })

  async function reauth () {
    remove()
    ready.value = false
    await doRedirect()
  }

  async function doRedirect () {
    const codeVerifier = generateRandomString(64)

    sessionStorage.setItem('code_verifier', codeVerifier)

    const hashed = await sha256(codeVerifier)
    const codeChallenge = base64encode(hashed)

    const url = new URL('https://accounts.spotify.com/authorize')
    const { client_id, redirect_uri } = params
    const urlparams = {
      client_id,
      scope: scopes.join(' '),
      redirect_uri,
      response_type: 'code',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    }
    for (const [key, value] of Object.entries(urlparams)) {
      url.searchParams.append(key, value as string)
    }
    const authUrl = (url.toString() as unknown) as Location
    document.location = authUrl
  }

  async function getToken (code: string) {
    const code_verifier = sessionStorage.getItem('code_verifier') ?? ''
    if (!code_verifier) {
      doRedirect()
    }
    const { client_id, redirect_uri } = params
    const payload = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id,
        code,
        redirect_uri,
        code_verifier
      })
    }
    try {
      const body = await fetch('https://accounts.spotify.com/api/token', payload)
      const response = await body.json()

      sessionStorage.setItem('spotify_token', response.access_token)
      const expires = new Date(Date.now() + (response.expires_in * 1000))
      sessionStorage.setItem('spotify_token_expires', expires.toISOString())

      return response.access_token
    } catch (e) {
      console.error('Unable to auth', e)
    }
    return null
  }

  return { client, ready, reauth }
}

const spotifyUser = createGlobalState(() =>
  reactive({
    id: '',
    name: ''
  })
)

export function useSpotifyUser (client?: SpotifyWebApi.SpotifyWebApiJs) {
  const state = spotifyUser()

  async function updateUser () {
    if (!client || !client.getAccessToken()) return setTimeout(() => updateUser, 1000)

    try {
      const u = await client.getMe()
      state.name = u.display_name ?? ''
      state.id = u.id
    } catch (e) {
      console.log('Unable to get user info', e)
    }
  }

  if (client) {
    onMounted(updateUser)
  }

  return state
}

const sha256 = async (plain: string) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return window.crypto.subtle.digest('SHA-256', data)
}

const base64encode = (input: ArrayBuffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

const generateRandomString = (length: number) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const values = crypto.getRandomValues(new Uint8Array(length))
  return values.reduce((acc, x) => acc + possible[x % possible.length], '')
}

export type SpotifyApi = SpotifyWebApi.SpotifyWebApiJs
