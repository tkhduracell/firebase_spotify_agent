<template>
    <div>
        <b-row align-h="center">
            <b-col cols="auto">
                <b-img fluid src="favicon2.svg" />
            </b-col>
            <b-col cols="auto" align-self="center">
                <h1>Welcome to Spotify Agent!</h1>
                <p>
                This is a music tool written to ease Spotify playback during dance traning.
                </p>
            </b-col>
        </b-row>
        <b-row align-h="center" v-if="ready">
            <b-col cols=auto>
                <StartSceen
                    :presets="presets"
                    :devices="devices ? devices.devices : undefined"
                    @play="play($event.id, $event.device)"
                    @devices:reload="loadDevices"
                />
            </b-col>
        </b-row>
        <b-row align-h="center" v-else>
            <b-col cols=12 class="mt-5">
                <div class="login">
                    <h3>First step is to login to your Spotify Account</h3>
                    <b-button variant="primary" size="lg" :to="{ name: 'Login' }">
                        Log in to Spotify
                    </b-button>
                </div>
            </b-col>
        </b-row>
    </div>
</template>

<script lang="ts">
import { defineComponent, computed, watch } from '@vue/composition-api'
import StartSceen from '@/components/StartSceen.vue'
import { useSpotifyState } from '@/state'
import { usePresets } from '@/presets'
import { useDevices } from '@/devices'
import { useSpotifyClient } from '@/auth'
import { useInterval } from 'vue-composable'
import { SpotifyApi } from '@/types'

export default defineComponent({
  components: { StartSceen },
  setup (props, { root: { $router } }) {
    const state = useSpotifyState()

    const { client } = useSpotifyClient()

    const { playlists } = usePresets()
    const { devices, loadDevices } = useDevices()

    useInterval(loadDevices, 2000)

    watch(() => state.token, async (t) => {
      if (t?.access_token && !t.expierd() && state.player) {
        const p = state.player
        await p.setVolume(0)
        console.log('Volume set 0')
      }
    })
    return {
      ready: computed(() => {
        return state.token?.access_token && !state.token.expierd()
      }),
      devices,
      loadDevices,
      play: async (context_uri: string, device?: SpotifyApi.UserDevice) => {
        const dev = device?.id ? { device_id: device.id } : {}
        console.log('Play', { context_uri, ...dev })
        await client.play({ context_uri, ...dev })
        try {
          await client.setShuffle(true, { ...dev })
        } catch (e) {}
        $router.push({ name: 'Player' })
      },
      presets: playlists
    }
  }
})
</script>

<style lang="scss" scoped>
.login {
    display: flex;
    flex-direction: column;
    align-items: center
}
</style>
