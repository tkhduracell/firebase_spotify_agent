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
      <b>Start a playlist</b>
    </p>
    <div class="mb-4">
      <b-button variant="outline-primary" @click="$emit('devices:reload')" class="mr-2">
        <b-icon-arrow-counterclockwise />
      </b-button>
      <b-form-select :value="device" @change="$emit('devices:select', $event)" v-if="devices" class="w-50 mr-2">
        <b-form-select-option v-for="dev in devices" :key="dev.id" :value="dev"> {{ dev.name }} ({{ dev.type }}) </b-form-select-option>
      </b-form-select>
      <b-button
        variant="outline-primary"
        @click="
          $emit('play', {
            id: 'spotify:playlist:7te7WrFpNb1rjk0WRarnNR',
            device,
          })
        "
      >
        <b-icon-play />
        Freesprut Buggisar
      </b-button>
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
import { defineComponent, PropType } from '@vue/composition-api'

export default defineComponent({
  props: {
    devices: {
      type: Array as PropType<SpotifyApi.UserDevice[]>,
      required: false,
    },
    device: {
      type: Object as PropType<SpotifyApi.UserDevice>,
      required: false,
    },
  },
})
</script>
<style></style>
