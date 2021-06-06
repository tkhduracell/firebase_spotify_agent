<template>
  <div>
    <h1>Welcome to Spotify Agent!</h1>
    <p>
      This is a music tool written to ease Spotify playback during dance traning.
    </p>
    <h2>How do I use it?</h2>
    <p>Let's go through each step.</p>
    <h4>1. Open this page (you're done already, great!)</h4>
    <p>Open this page in any modern browser.</p>
    <h4>2. Open Spotify</h4>
    <p>
      Open Spotify on your computer or use your mobile.
    </p>
    <h4>3. Play a playlist</h4>
    <p>
      Find a playlist with <b>MANY</b> tracks that can be the source for you playback. If you don't have anyone, you can choose to start the
      one below.
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
          <b-td>
            <b-button
              variant="primary"
              @click="
                $emit('play', {
                  id: 'spotify:playlist:27v5fDNRFr9lf2GUBxr5c8',
                  device,
                })
              "
            >
              <b-icon-play-fill scale="1.2" />
            </b-button>
          </b-td>
        </b-tr>
      </b-table-simple>
    </div>
    <h4>Current features</h4>
    <ul>
      <li>Switch track after a fixed number of seconds.</li>
      <li>Limit playlist to a tempo range.</li>
      <li>Lower volume between tracks.</li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, PropType } from '@vue/composition-api'
import { useInterval } from 'vue-composable'

export default defineComponent({
  props: {
    devices: {
      type: Array as PropType<SpotifyApi.UserDevice[]>,
      required: false,
    },
  },
  setup(props, { emit }) {
    const { start, remove } = useInterval(() => emit('devices:reload'), 2000)

    onMounted(start)
    onUnmounted(remove)

    return {}
  },
})
</script>
<style></style>
