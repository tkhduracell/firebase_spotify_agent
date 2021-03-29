import { onMounted, onUnmounted, ref } from '@vue/composition-api'
import SpotifyWebApi from 'spotify-web-api-js'
import { Route } from 'vue-router'

export function useSpotifyRedirect(
  $route: Route,
  onInit?: () => unknown,
  onRefresh?: () => unknown,
  scopes = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-read-recently-played',
  ]
) {
  const refresh = ref<number>()

  const client = new SpotifyWebApi()

  const location = document.location
  const url = new URL('https://accounts.spotify.com/authorize')
  url.searchParams.append('client_id', '2c23b47cf7274b24b1a34382a32ac94b')
  url.searchParams.append('response_type', 'token')
  url.searchParams.append(
    'redirect_uri',
    `${location.protocol}//${location.hostname}${
      location.port ? ':' + location.port : ''
    }${location.pathname}`
  )
  url.searchParams.append('scope', scopes.join(','))
  const authUrl = (url.toString() as unknown) as Location

  onUnmounted(() => {
    if (refresh.value) clearInterval(refresh.value)
  })

  onMounted(async () => {
    if ($route.hash.includes('access_token')) {
      const params = new URLSearchParams($route.hash.replace(/^#/gim, ''))
      const token = params.get('access_token')
      client.setAccessToken(token)

      if (onInit) {
        await onInit()
      }
    } else {
      document.location = authUrl
    }

    if (onRefresh) {
      refresh.value = setInterval(onRefresh, 1000)
    }
  })

  function reauth() {
    document.location = authUrl
  }

  return { client, reauth }
}
