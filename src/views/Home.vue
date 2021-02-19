<template>
  <div class="home">
    <div v-if="state && state.is_playing && state.item" class="state">
      <h1>{{ name }}</h1>
      <h4>{{seconds}} seconds / {{secondsTotal}} </h4>
      <div v-for="img in state.item.album.images" :key="img.url">
        <img :src="img.url" v-if="img.width === 300" class="image" />
      </div>

      <pre>{{ JSON.stringify(state, null, 2) }}
      </pre>
    </div>
    <div v-else>
      <h1>Not playing</h1>
      <p>Play something with you spotify client.</p>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from '@vue/composition-api'

import Spotify from 'spotify-web-api-js'

export default defineComponent({
  name:'Home',
  setup(props, { root: { $route } }) {
    const state = ref<SpotifyApi.CurrentlyPlayingResponse>()

    let refresh: any = null
    const client = new Spotify();

    async function update() {
      state.value = await client.getMyCurrentPlayingTrack()
    }

    const seconds = computed(() => {
      return state.value ?
        ((state.value.progress_ms ?? 0) / 1000).toFixed(1) :
        0
    })
    const secondsTotal = computed(() => {
      return state.value ?
        ((state.value.item?.duration_ms ?? 0) / 1000).toFixed(1) :
        0
    })

    const name = computed(() => {
      if (state.value?.is_playing && state.value.item) {
        const { item } = state.value
        return item.artists.map(a => a.name).join(', ') + ' - ' + item?.name
      }
      return ''
    })

    watch(seconds, (s) => {
      if (s > 90) {
        client.skipToNext()
      }
    })

    onUnmounted(() => {
      if (refresh) clearInterval(refresh)
    })

    onMounted(async () => {
      const url = new URL('https://accounts.spotify.com/authorize')
      url.searchParams.append('client_id', '2c23b47cf7274b24b1a34382a32ac94b')
      url.searchParams.append('response_type', 'token')
      url.searchParams.append('redirect_uri', document.location.toString())
      url.searchParams.append('scope', [
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-currently-playing'
      ].join(','))

      if ($route.hash.includes('access_token')) {
        const params = new URLSearchParams($route.hash.replace(/^#/gmi, ''))
        const token = params.get('access_token')
        client.setAccessToken(token)

        const result = await client.getMyCurrentPlayingTrack()
        refresh = setInterval(update, 1000)

        state.value = result
      } else {
        document.location = url.toString() as unknown as Location
      }

    })

    return {
      name,
      seconds, secondsTotal,
      state
    }
  }
})
</script>

<style lang="scss">
.home {
  display: flex;
  align-items: center;
  justify-content: center;

  .state {
    width: 60em;
    height: 90em;
    text-align: center;

    pre {
      text-align: left;
      border: 1px solid gainsboro;
      border-radius: 8px;
    }
  }
}
</style>
