import { onMounted, ref } from '@vue/composition-api'
import SpotifyWebApi from 'spotify-web-api-js'

export function useDevices(client: SpotifyWebApi.SpotifyWebApiJs) {
  const devices = ref<SpotifyApi.UserDevicesResponse>()
  const device = ref<SpotifyApi.UserDevice>()

  async function loadDevices() {
    devices.value = await client.getMyDevices()
    device.value = devices.value.devices.find(() => true)
  }

  onMounted(() => loadDevices())

  return { device, devices, loadDevices }
}
