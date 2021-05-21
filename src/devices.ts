import { onMounted, ref } from '@vue/composition-api'
import SpotifyWebApi from 'spotify-web-api-js'

export function useDevices(client: SpotifyWebApi.SpotifyWebApiJs) {
  const devices = ref<SpotifyApi.UserDevicesResponse>()

  async function loadDevices() {
    devices.value = await client.getMyDevices()
  }

  onMounted(() => loadDevices())

  return { devices, loadDevices }
}
