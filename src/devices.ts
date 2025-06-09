import { onMounted, ref } from '@vue/composition-api'

import SpotifyWebApi from 'spotify-web-api-js'
import { useInterval } from 'vue-composable'

export type Device = {
  id: string
  name: string,
  type: string,
  is_active: boolean,
  is_private_session: boolean,
  is_restricted: boolean,
  supports_volume: boolean,
  volume_percent: number
}

export function useDevices (client: SpotifyWebApi.SpotifyWebApiJs) {
  const devices = ref<Device[]>()
  const activeDevice = ref<Device>()

  async function reloadDevices () {
    const result = await client.getMyDevices() as SpotifyApi.UserDevicesResponse
    devices.value = result.devices as Device[]
    if (devices.value && devices.value.length > 0) {
      activeDevice.value = devices.value.find(device => device.is_active)
    } else {
      activeDevice.value = undefined
    }
  }

  onMounted(() => {
    reloadDevices()
  })

  useInterval(() => {
    reloadDevices()
  }, 2_000)

  return { devices, activeDevice, reloadDevices }
}
