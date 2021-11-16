<template>
  <div>
    <b-row>
      <b-col cols="3">
        <b-img fluid src="favicon2.svg" />
      </b-col>
      <b-col cols="9" align-self="center">
        <h1>Welcome to Spotify Agent!</h1>
        <p>
          This is a music tool written to ease Spotify playback during dance traning.
        </p>
      </b-col>
    </b-row>

    <h2 class="mt-3">How do I use it?</h2>
    <p>Let's go through each step.</p>
    <h4>1. Open this page</h4>
    <p>Open this page in any modern browser.</p>
    <p>Great, you're already done!</p>
    <h4>2. Open Spotify</h4>
    <p>
      Open Spotify on your computer or use your mobile.
    </p>
    <h4>3. Select device</h4>
    <p>
      Select your device in the list and press play on the wished music style.
    </p>
    <p>
      <b>Start playing on a device</b>
    </p>
    <div class="mb-4">
      <b-table-simple table-variant="dark" dark borderless>
        <b-tr class="device-row mb-2" v-for="device in devices || []" :key="device.id">
          <b-td class="">
            <b-icon-speaker scale="1.6" v-if="device.type === 'Speaker'" />
            <b-icon-laptop scale="1.6" v-else-if="device.type === 'Computer'" />
            <b-icon-tv scale="1.6" v-else-if="device.type === 'Chromecast'" />
            <b-icon-phone scale="1.6" v-else-if="device.type === 'Smartphone'" />
            <b-icon-box scale="1.6" v-else />
          </b-td>
          <b-td>
            <span class="pt-1 ml-4 d-inline-block mr-4" v-text="device.name" />
          </b-td>
          <b-td class="presets">
            <b-button
              v-for="pl in presets"
              :key="pl.id + device.id"
              variant="primary"
              class="mr-2"
              @click="
                $emit('play', {
                  id: pl.uri,
                  device,
                })
              "
            >
              {{ pl.name }}
            </b-button>
          </b-td>
        </b-tr>
      </b-table-simple>
    </div>
    <p>If you have any other playlist you'd like to use. Just start that playlist from the Spotify app.</p>
    <h4>Current features</h4>
    <ul>
      <li>Switch track after a fixed number of seconds.</li>
      <li>Limit playlist to a tempo range.</li>
      <li>Lower volume between tracks.</li>
      <li>Hotkeys (space, p, n, pgup, pgdown, hoem, end)</li>
    </ul>
  </div>
</template>

<script lang="ts">
import { PlaylistInfo } from '@/presets'
import { defineComponent, onMounted, onUnmounted, PropType } from '@vue/composition-api'
import { useInterval } from 'vue-composable'
import { SpotifyApi } from '@/auth'
export default defineComponent({
  props: {
    devices: {
      type: Array as PropType<SpotifyApi.UserDevice[]>,
      required: false
    },
    presets: {
      type: Array as PropType<PlaylistInfo[]>,
      required: false,
      default: () => []
    }
  },
  setup (props, { emit }) {
    const { start, remove } = useInterval(() => emit('devices:reload'), 2000)

    onMounted(start)
    onUnmounted(remove)

    return {}
  }
})
</script>

<style lang="scss">
.presets {
  display: flex;
}
</style>
