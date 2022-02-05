import { useSpotifyState } from './state'
import { onMounted, ref, watch } from '@vue/composition-api'
import SpotifyWebApi from 'spotify-web-api-js'

export function useDevices (client: SpotifyWebApi.SpotifyWebApiJs) {
  const devices = ref<SpotifyApi.UserDevicesResponse>()

  async function loadDevices () {
    if (client.getAccessToken()) {
      devices.value = await client.getMyDevices()
    }
  }

  const state = useSpotifyState()
  watch(() => state.token, loadDevices)

  onMounted(() => loadDevices())

  return { devices, loadDevices }
}
