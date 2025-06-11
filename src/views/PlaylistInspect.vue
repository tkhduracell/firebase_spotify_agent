<template>
  <b-container fluid="lg" class="recs">
    <b-row>
      <b-col>
        <h1>Playlist inspector</h1>
        <p>
          Here you can inspect playlists. Paste the share link below.
        </p>
        <b-form>
          <b-form-row>
            <b-col cols="6">
              <b-row class="no-gutters">
                <b-col>
                  <b-form-input type="text" v-model="playlist.url" />
                </b-col>
                <b-col cols="auto">
                  <b-button @click="reload" variant="primary">
                    <b-icon-arrow-clockwise />
                  </b-button>
                </b-col>
              </b-row>
            </b-col>
            <div class="w-100" />
            <b-col cols="6">
              <b-form-checkbox v-model="sorted" class="mt-1" v-if="playlist.url">
                Sort by tempo?
              </b-form-checkbox>
            </b-col>
          </b-form-row>
        </b-form>
      </b-col>
    </b-row>
    <b-row class="mt-3" v-if="playlist.url">
      <b-col cols="6" md="6" v-if="loading.info || !playlist.info">
        <b-spinner />
      </b-col>
      <b-col cols="12" md="6" v-else>
        <h2 v-text="playlist.info.name" />
        <b-img :src="(playlist.info.images.find(() => true) || {}).url" height="200" />

        <p v-if="playlist.tracks.length > 0" v-text="`${playlist.tracks.length} songs`" />
        <p v-if="playlist.info.description" v-text="playlist.info.description" class="small" />

        <b-spinner v-if="loading.tracks" />
        <div v-if="playlist.tracks.length > 0">
          <div v-for="(t, idx) in playlist.tracks" :key="idx + t.id">
            <div class="row">
              <div class="col-12">
                <b-progress :value="t.bpm - playlistStats.min" :max="playlistStats.max - playlistStats.min" :variant="variant(t.bpm)" class="bpmbar" />
                <b-link @click="play(t)" v-text="trackFormat(t, true)" class="text-truncate" />
              </div>
            </div>
          </div>
        </div>
      </b-col>
      <b-col cols="12" md="5" class="mt-2" v-if="playlist.info">
        <h2>Tracks per tempo</h2>
        <Chart :options="playlist.chartoptions" :chartData="playlist.chart" v-if="playlist.chart && playlist.chartoptions" />
      </b-col>
    </b-row>
  </b-container>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, Ref, ref, watch } from '@vue/composition-api'

import { TrackWithBPM, TrackDatabase } from '@/tracks'
import { useSpotifyRedirect } from '@/auth'
import { PlaylistDatabase } from '@/playlists'

import { asyncComputed, useSessionStorage } from '@vueuse/core'
import { sortBy, groupBy, range, max, min } from 'lodash'
import Chart from '@/components/Chart.vue'

export default defineComponent({
  name: 'PlaylistInspect',
  components: { Chart },
  setup (props, { root: { $route } }) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const { client, ready } = useSpotifyRedirect($route, onReady)

    function trackFormat (track: TrackWithBPM, showBPM = false): string {
      // eslint-disable-next-line no-debugger
      if (typeof track.bpm !== 'number') debugger
      const prefix = showBPM ? track.bpm.toFixed() + ' bpm - ' : ''
      return `${prefix}${track.artist} - ${track.title}`.slice(0, 50)
    }

    const tracks = new TrackDatabase(client)
    const playlists = new PlaylistDatabase(client)
    const force = ref(1)
    function reload () {
      force.value = new Date().getTime()
    }

    const playlistUrl = useSessionStorage('playlist-url', '')
    const playlistId = computed(() =>
      ready.value && playlistUrl.value
        ? playlistUrl.value
          .trim()
          .replace(/\?.*$/gi, '')
          .split('/')
          .slice(-1)
          .find(() => true) ?? ''
        : ''
    )

    watch(playlistUrl, () => {
      playlistUrl.value = playlistUrl.value.replace(/\?.*$/gi, '')
    })

    const loadingInfo = ref(false)
    const playlistInfo = asyncComputed(() => (force.value && playlistId.value ? client.getPlaylist(playlistId.value) : undefined), undefined, loadingInfo)

    const loadingTracks = ref(false)
    const playlistTracksUnordered: Ref<TrackWithBPM[]> = asyncComputed<TrackWithBPM[]>(
      () => (force.value && playlistId.value ? playlists.getPlaylistTracks(playlistId.value).then(tracks.getTracksWithTempo.bind(tracks)) : []),
      [],
      loadingTracks
    )

    const sorted = ref(true)
    const playlistTracks = computed(() => {
      return sorted.value ? sortBy(playlistTracksUnordered.value, t => t.bpm) : playlistTracksUnordered.value
    })
    const playlistStats = computed(() => {
      const bpms = playlistTracksUnordered.value.map(t => t.bpm)
      return {
        max: max(bpms) as number ?? 200,
        min: min(bpms) as number ?? 60
      }
    })
    const playlistTempoHistorgram = computed(() => {
      const groups = groupBy(
        playlistTracksUnordered.value.filter(t => t.bpm > 0),
        t => t.bpm - (t.bpm % 10)
      )
      const maxBPM = max(Object.keys(groups).map(g => parseInt(g)))
      const minBPM = min(Object.keys(groups).map(g => parseInt(g)))

      if (minBPM && maxBPM) {
        for (const i of range(minBPM, maxBPM + 10, 10)) {
          groups[`${i}`] = groups[`${i}`] ?? []
        }
      }

      const buckets: [string, number][] = sortBy(
        Object.entries(groups).map(([group, t]) => [parseInt(group) + '-' + (parseInt(group) + 10), t.length]),
        ([k]) => parseInt(k)
      )
      return buckets
    })
    const playlistTempoChart = computed(() => {
      return {
        labels: playlistTempoHistorgram.value.map(kv => kv[0]),
        datasets: [
          {
            data: playlistTempoHistorgram.value.map(kv => kv[1]),
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(255, 159, 64, 0.2)',
              'rgba(255, 205, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(201, 203, 207, 0.2)',
              'rgba(255, 99, 132, 0.2)',
              'rgba(255, 159, 64, 0.2)',
              'rgba(255, 205, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(201, 203, 207, 0.2)'
            ],
            borderColor: [
              'rgb(255, 99, 132)',
              'rgb(255, 159, 64)',
              'rgb(255, 205, 86)',
              'rgb(75, 192, 192)',
              'rgb(54, 162, 235)',
              'rgb(153, 102, 255)',
              'rgb(201, 203, 207)',
              'rgb(255, 99, 132)',
              'rgb(255, 159, 64)',
              'rgb(255, 205, 86)',
              'rgb(75, 192, 192)',
              'rgb(54, 162, 235)',
              'rgb(153, 102, 255)',
              'rgb(201, 203, 207)'
            ],
            borderWidth: 1
          }
        ]
      }
    })

    function variant (bpm: number) {
      if (bpm < 80) return 'danger'
      if (bpm < 100) return 'warning'

      if (bpm > 148) return 'warning'
      if (bpm > 172) return 'danger'
      return 'success'
    }

    async function play (track: TrackWithBPM) {
      await client.queue('spotify:track:' + track.id)
      setTimeout(async () => {
        await client.skipToNext()
      }, 500)
    }

    async function onReady () {
      const state = await client.getMyCurrentPlaybackState()
      if (state.context?.type === 'playlist' && !playlistUrl.value) {
        playlistUrl.value = state.context.external_urls?.spotify ?? ''
      }
    }

    return {
      tracks,
      play,
      reload,
      loading: reactive({
        info: loadingInfo,
        tracks: loadingTracks
      }),
      playlist: reactive({
        url: playlistUrl,
        id: playlistId,
        tracks: playlistTracks,
        info: playlistInfo,
        chart: playlistTempoChart,
        chartoptions: {
          legend: { display: false },
          scales: {
            gridLines: {
              display: false
            },
            yAxes: [
              {
                gridLines: {
                  color: 'rgba(255, 255, 255, 0.2)'
                },
                ticks: {
                  fontColor: 'rgba(255, 255, 255, 0.9)'
                }
              }
            ],
            xAxes: [
              {
                gridLines: {
                  color: 'rgba(255, 255, 255, 0.2)'
                },
                ticks: {
                  fontColor: 'rgba(255, 255, 255, 0.9)'
                }
              }
            ]
          }
        }
      }),
      trackFormat,
      variant,
      sorted,
      playlistStats
    }
  }
})
</script>

<style lang="scss">
.bpmbar {
  width: 100px;
  float: left;
  margin: 0.2em 0.4em;
}
</style>
