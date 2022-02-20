<template>
  <div>
    <h1 class="mt-4">What do you want to play?</h1>
    <div class="playlists">

        <div class="item" v-for="playlist in presets"
          :key="'own-' + playlist.id"
          @click="play(playlist.uri, thisDevice, 'own-' + playlist.id)">
            <div class="title">{{ playlist.name }}</div>
            <div class="image">
              <b-overlay :show="pending === 'own-' + playlist.id" rounded="sm" variant="dark" spinner-variant="primary">
                <img :src="playlist.image_large" :alt="'Playlist cover of ' + playlist.name">
              </b-overlay>
            </div>
            <div class="size">{{ playlist.size }} songs</div>

        </div>
    </div>
    <div class="mb-4" v-if="otherDevices.length > 0">
      <h4>Play on another device?</h4>
      <b-table-simple table-variant="dark" dark borderless>
        <b-tr class="device-row mb-2" v-for="device in otherDevices || []" :key="device.id">
          <b-td class="icon">
            <DeviceIcon :type="device.type" />
          </b-td>
          <b-td class="name">
            <span class="pt-1 ml-4 d-inline-block mr-4" v-text="device.name" />
          </b-td>
          <b-td class="presets">
            <b-button
              v-for="pl in presets"
              :key="device.id + '-' + pl.id"
              variant="primary"
              class="mr-2 position-relative"
              @click="play(pl.uri, device, device.id + '-' + pl.id)"
            >

            <b-icon-circle-fill animation="throb" v-if="pending === device.id + '-' + pl.id" />
            <span :class="{'ml-2': pending === device.id + '-' + pl.id }">{{ pl.name }}</span>

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
      <li>Hotkeys (space, p, n, pgup, pgdown, home, end)</li>
    </ul>
  </div>
</template>

<script lang="ts">
import { PlaylistInfo } from '@/playlists'
import { computed, defineComponent, onMounted, onUnmounted, PropType, ref } from '@vue/composition-api'
import { useInterval } from 'vue-composable'
import { SpotifyApi } from '@/types'

import DeviceIcon from '@/components/DeviceIcon.vue'

export default defineComponent({
  components: { DeviceIcon },
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
    onUnmounted(remove)
    onMounted(start)

    const pending = ref()
    return {
      thisDevice: computed(() => props.devices?.find(d => d.name === 'Spotify Agent')),
      otherDevices: computed(() => props.devices?.filter(d => d.name && d.name !== 'Spotify Agent') ?? []),
      play: (uri: string, device?: SpotifyApi.UserDevice, key?: string) => {
        pending.value = key
        emit('play', { id: uri, device: device })
        setTimeout(() => {
          pending.value = undefined
        }, 5000)
      },
      pending
    }
  }
})
</script>

<style lang="scss">
.presets {
  display: flex;
}
.device-row {
  .icon,.name {
    vertical-align: middle;
  }
}
.playlists {
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-direction: row;
  margin: 2em 0;
  height: 260px;

  .item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    min-width: 250px;

    .title { font-size: 1.6em; margin-bottom: 0.6em; }
    .size { font-size: 1.0em; margin-top: 0.6em; }
    .image img {
      transition: all ease-in-out 0.2s;
      width: 200px;
    }

    &:hover {
      .image img {
        width: 220px;
      }
    }
    &:active {
      .image img {
        width: 240px;
      }
    }
  }
}
</style>
