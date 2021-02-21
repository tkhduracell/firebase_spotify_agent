<template>
  <b-container fluid class="home">
    <b-row v-if="state && state.is_playing && state.item" class="state">
      <b-col cols="6">
        <div class="analysis" v-if="analysis">
          <div>{{ analysis.tempo.toFixed(0) }} BPM</div>
        </div>

        <div class="header">
          <h1>{{ name }}</h1>
          <h4>
            {{ seconds.toFixed(0) }} / {{ secondsTotal.toFixed(0) }} seconds
          </h4>

          <b-progress height="2rem" :max="max" class="mb-3 progress">
            <b-progress-bar
              :value="seconds"
              :label="progressLabel"
            ></b-progress-bar>
          </b-progress>
        </div>

        <PlaybackLimiter
          :value="max"
          @update:value="max = $event"
          class="limiter"
        />
        <b-row class="mt-2">
          <b-col cols="4">
            <b class="d-block">Controls</b>
            <b-row>
              <b-col>
                <b-button variant="link" @click="playPrev">
                  <b-icon-arrow-bar-left scale="3.0" class="mt-4 mb-4" />
                </b-button>
              </b-col>
              <b-col>
                <b-button variant="link" @click="play" v-if="state.is_playing">
                  <b-icon-pause scale="3.0" class="mt-4 mb-4" />
                </b-button>
                <b-button variant="link" @click="play" v-else>
                  <b-icon-play scale="3.0" class="mt-4 mb-4" />
                </b-button>
              </b-col>
              <b-col>
                <b-button variant="link" @click="playNext">
                  <b-icon-arrow-bar-right scale="3.0" class="mt-4 mb-4" />
                </b-button>
              </b-col>
            </b-row>
          </b-col>
          <b-col cols="8">
            <b class="d-block">Last played</b>
            <div v-if="history && history.items">
              <div
                v-for="l in history.items"
                :key="'h-' + l.track.id"
                v-text="trackFormat(l.track, true)"
              />
            </div>
            <b-spinner v-else />
          </b-col>
        </b-row>
      </b-col>
      <b-col cols="6">
        <div v-for="img in state.item.album.images" :key="img.url">
          <b-img fluid :src="img.url" v-if="img.width === 640" class="image" />
        </div>
      </b-col>
      <b-sidebar id="sidebar-debug" title="JSON Data" width="60%" shadow>
        <div class="px-3 py-2">
          <pre>{{ JSON.stringify(state, null, 2) }}</pre>
        </div>
      </b-sidebar>
    </b-row>
    <div v-else-if="state && !state.is_playing">
      <h1>Not playing</h1>
      <p>Play something with you spotify client.</p>
      <b>Try this:</b>
      <b-button
        variant="link"
        @click="play('spotify:playlist:7te7WrFpNb1rjk0WRarnNR')"
      >
        <b-icon-play />
        Freesprut Buggisar
      </b-button>
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
  reactive,
  ref,
  watch,
} from '@vue/composition-api'

import Spotify from 'spotify-web-api-js'

import PlaybackLimiter from '@/components/PlaybackLimiter.vue'
import Vue from 'vue'

export default defineComponent({
  name: 'Home',
  components: { PlaybackLimiter },
  setup(props, { root: { $route } }) {
    const state = ref<SpotifyApi.CurrentlyPlayingResponse>()
    const analysis = ref<SpotifyApi.AudioFeaturesResponse>()
    const history = ref<SpotifyApi.UsersRecentlyPlayedTracksResponse>()
    const bpms = reactive<Record<string, number>>({})
    const error = ref<SpotifyApi.ErrorObject>()

    const max = ref<number>(100)
    const enabled = ref<boolean>(false)

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

    function trackFormat(
      track: SpotifyApi.TrackObjectSimplified,
      showBPM = false
    ): string {
      const artist = track.artists.map(a => a.name).join(', ')
      const title = track.name
      const bpmSuffix =
        showBPM && track.id in bpms
          ? ' (' + bpms[track.id].toFixed(0) + ' bpm)'
          : ''
      return `${artist} - ${title}${bpmSuffix}`
    }

    const seconds = computed(() => {
      return state.value ? (state.value.progress_ms ?? 0) / 1000 : 0
    })
    const secondsTotal = computed(() => {
      return state.value ? (state.value.item?.duration_ms ?? 0) / 1000 : 0
    })

    const name = computed(() => {
      if (state.value?.is_playing && state.value.item) {
        return trackFormat(state.value.item)
      }
      return ''
    })

    const progressLabel = computed(() => {
      const left = Math.max(max.value - seconds.value, 0).toFixed(0)
      const pct = ((seconds.value / max.value) * 100).toFixed(0)
      return seconds.value / max.value < 0.1
        ? ''
        : `${pct}% (${left} seconds left)`
    })

    watch(
      () => state.value?.item?.id,
      async id => {
        if (id) {
          analysis.value = await client.getAudioFeaturesForTrack(id)
          Vue.set(bpms, id, analysis.value.tempo)
          history.value = await client.getMyRecentlyPlayedTracks({ limit: 5 })
        }
      }
    )

    watch(
      () => history.value,
      async h => {
        if (h) {
          for (const item of h.items) {
            const id = item.track.id
            if (!bpms[id]) {
              const { tempo } = await client.getAudioFeaturesForTrack(id)
              Vue.set(bpms, id, tempo)
            }
          }
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
          'user-read-recently-played',
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

    async function play(context: string) {
      // eslint-disable-next-line @typescript-eslint/camelcase
      await client.play(context ? { context_uri: context } : {})
    }

    async function playNext() {
      await client.skipToNext()
    }
    async function playPrev() {
      await client.skipToPrevious()
    }

    return {
      name,
      seconds,
      secondsTotal,
      progressLabel,
      state,
      max,
      enabled,
      error,
      analysis,
      history,
      bpms,
      trackFormat,
      play,
      playNext,
      playPrev,
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
