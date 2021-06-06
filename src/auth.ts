import { onMounted, onUnmounted } from '@vue/composition-api'
import SpotifyWebApi from 'spotify-web-api-js'
import { useInterval } from 'vue-composable'
import { Route } from 'vue-router'

export function useSpotifyRedirect(
  $route: Route,
  onInit?: () => unknown,
  onRefresh?: () => unknown,
  scopes = ['user-read-playback-state', 'user-modify-playback-state', 'user-read-currently-playing', 'user-read-recently-played']
) {
  const client = new SpotifyWebApi()

  const location = document.location
  const url = new URL('https://accounts.spotify.com/authorize')
  url.searchParams.append('client_id', '0b2b46c7f3a04217bc9e3ee9f7053d7a')
  url.searchParams.append('response_type', 'token')
  url.searchParams.append(
    'redirect_uri',
    `${location.protocol}//${location.hostname}${location.port ? ':' + location.port : ''}${location.pathname}`
  )
  url.searchParams.append('scope', scopes.join(','))
  const authUrl = (url.toString() as unknown) as Location

  const { start, remove } = useInterval(onRefresh ? () => onRefresh() : () => null, 1000)

  onUnmounted(remove)

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
    start()
  })

  function reauth() {
    document.location = authUrl
  }

  return { client, reauth }
}
