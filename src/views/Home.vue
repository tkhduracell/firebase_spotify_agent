<template>
  <b-container fluid class="home">
    <b-row v-if="state && state.is_playing && state.item" class="state">
      <b-col cols="6">
        <div class="header">
          <h1>{{ name }}</h1>
          <h4>
            {{ seconds.toFixed(0) }} / {{ secondsTotal.toFixed(0) }} seconds
          </h4>

          <b-progress height="2rem" :max="max" class="mb-3 progress">
            <b-progress-bar
              :value="seconds"
              :label="
                `${((seconds / max) * 100).toFixed(0)}% (${(
                  max - seconds
                ).toFixed(0)} seconds left)`
              "
            ></b-progress-bar>
          </b-progress>
        </div>

        <PlaybackLimiter
          :value="max"
          @update:value="max = $event"
          class="limiter"
        />

        <div class="analysis" v-if="analysis">
          <div>{{ analysis.tempo.toFixed(0) }} BPM</div>
        </div>

        <b-button class="debug mt-2" size="sm" v-b-toggle.sidebar-1>
          Show JSON
        </b-button>
      </b-col>
      <b-col cols="6">
        <div v-for="img in state.item.album.images" :key="img.url">
          <b-img fluid :src="img.url" v-if="img.width === 640" class="image" />
        </div>
      </b-col>
      <b-sidebar id="sidebar-1" title="JSON Data" width="60%" shadow>
        <div class="px-3 py-2">
          <pre>{{ JSON.stringify(state, null, 2) }}</pre>
        </div>
      </b-sidebar>
    </b-row>
    <div v-else-if="state && !state.is_playing">
      <h1>Not playing</h1>
      <p>Play something with you spotify client.</p>
    </div>
    <div v-else-if="error && error.status === 401">
      <b-card class="bg-dark text-light">
        <p>You have been logged out.</p>
        <b-button variant="primary" href="/" class="w-100"
          >Login me in again!</b-button
        >
      </b-card>
    </div>
    <div v-else>
      Nothing is playing right now.
    </div>
  </b-container>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from '@vue/composition-api'

import Spotify from 'spotify-web-api-js'

import PlaybackLimiter from '@/components/PlaybackLimiter.vue'

export default defineComponent({
  name: 'Home',
  components: { PlaybackLimiter },
  setup(props, { root: { $route } }) {
    const state = ref<SpotifyApi.CurrentlyPlayingResponse>()
    const analysis = ref<SpotifyApi.AudioFeaturesResponse>()
    const error = ref<SpotifyApi.ErrorObject>()
    const max = ref<number>(100)

    let refresh: number | null = null
    const client = new Spotify()

    async function update() {
      try {
        const res = (await client.getMyCurrentPlayingTrack()) as
          | ''
          | SpotifyApi.CurrentlyPlayingResponse
        state.value = res === '' ? undefined : res
      } catch (err) {
        if (err.status === 401 && err.responseText) {
          const { error: errorObj } = JSON.parse(err.responseText)
          error.value = errorObj
          if (refresh) clearInterval(refresh)
        }
        console.error(err)
      }
    }

    const seconds = computed(() => {
      return state.value ? (state.value.progress_ms ?? 0) / 1000 : 0
    })
    const secondsTotal = computed(() => {
      return state.value ? (state.value.item?.duration_ms ?? 0) / 1000 : 0
    })

    const name = computed(() => {
      if (state.value?.is_playing && state.value.item) {
        const { item } = state.value
        return item.artists.map(a => a.name).join(', ') + ' - ' + item?.name
      }
      return ''
    })

    watch(
      () => state.value?.item?.id,
      async id => {
        if (id) {
          analysis.value = await client.getAudioFeaturesForTrack(id)
        }
      }
    )

    watch(state, s => {
      if (s && (s.progress_ms ?? 0) > max.value * 1000) {
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
      url.searchParams.append(
        'scope',
        [
          'user-read-playback-state',
          'user-modify-playback-state',
          'user-read-currently-playing',
        ].join(',')
      )

      if ($route.hash.includes('access_token')) {
        const params = new URLSearchParams($route.hash.replace(/^#/gim, ''))
        const token = params.get('access_token')
        client.setAccessToken(token)

        await update()
      } else {
        document.location = (url.toString() as unknown) as Location
      }

      refresh = setInterval(update, 1000)
    })

    return {
      name,
      seconds,
      secondsTotal,
      state,
      max,
      error,
      analysis,
    }
  },
})
</script>

<style lang="scss">
.home {
  display: flex;
  justify-content: center;

  .state {
    .header {
      text-align: center;
    }
    .image {
      margin-top: 1em;
    }
    .progress {
      background: #1b5894;
    }
    .limiter {
      margin-top: 4rem;
    }
    .analysis {
      margin-top: 2rem;
      font-size: 8em;
      text-align: center;
    }

    .debug {
      position: absolute;
      bottom: 0;
    }

    pre {
      text-align: left;
      border: 1px solid gainsboro;
      border-radius: 8px;
    }
  }
}
</style>
