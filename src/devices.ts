import { useSpotifyState } from './state'
import { computed, onMounted, ref, watch } from '@vue/composition-api'
import SpotifyWebApi from 'spotify-web-api-js'
import { useSpotifyClient } from './auth'
import { useInterval } from 'vue-composable'

export function useDevices () {
  const { client } = useSpotifyClient()
  const devices = ref<SpotifyApi.UserDevicesResponse>()

  async function loadDevices () {
    if (client.getAccessToken()) {
      devices.value = await client.getMyDevices()
    }
  }

  const state = useSpotifyState()
  watch(() => state.token, loadDevices)

  onMounted(() => loadDevices())

  return { devices, loadDevices, thisDevice: computed(() => devices.value?.devices.find(d => d.name === 'Spotify Agent')) }
}
