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
              <b-form-input type="text" v-model="playlist.url" />
              <b-form-checkbox v-model="sorted">
                Sort by tempo?
              </b-form-checkbox>
            </b-col>
          </b-form-row>
        </b-form>
      </b-col>
    </b-row>
    <b-row class="mt-3">
      <b-col cols="6" v-if="loading.info">
        <b-spinner />
      </b-col>
      <b-col cols="6" v-else>
        <h2 v-text="playlist.info.name" />
        <p v-if="playlist.tracks.length > 0" v-text="`${playlist.tracks.length} songs`" />
        <p v-if="playlist.info.description" v-text="playlist.info.description" />

        <b-spinner v-if="loading.tracks" />
        <div v-if="playlist.tracks.length > 0">
          <div v-for="(t, idx) in playlist.tracks" :key="idx + t.id">
            <b-link @click="play(t)" v-text="trackFormat(t, true)" />
          </div>
        </div>
      </b-col>
      <b-col cols="6" class="">
        <h2>Tracks per tempo</h2>
        <Chart :options="playlist.chartoptions" :chartData="playlist.chart" />
      </b-col>
    </b-row>
  </b-container>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/camelcase */
import { computed, defineComponent, reactive, ref } from '@vue/composition-api'

import { TrackWithBPM, TrackDatabase } from '@/tracks'
import { useSpotifyRedirect } from '@/auth'
import { PlaylistDatabase } from '@/playlists'

import { asyncComputed } from '@vueuse/core'
import { sortBy, groupBy, range, max, min } from 'lodash'
import Chart from '@/components/Chart.vue'

export default defineComponent({
  name: 'PlaylistInspect',
  components: { Chart },
  setup(props, { root: { $route } }) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const { client } = useSpotifyRedirect($route, onReady)

    function trackFormat(track: TrackWithBPM, showBPM = false): string {
      // eslint-disable-next-line no-debugger
      if (typeof track.bpm !== 'number') debugger
      const prefix = showBPM ? track.bpm.toFixed() + ' bpm - ' : ''
      return `${prefix}${track.artist} - ${track.title}`
    }

    const tracks = new TrackDatabase(client)
    const playlists = new PlaylistDatabase(client)

    const playlistUrl = ref('')
    const playlistId = computed(() =>
      playlistUrl.value
        ? playlistUrl.value
            .split('/')
            .slice(-1)
            .find(() => true) ?? ''
        : ''
    )

    const loadingInfo = ref(false)
    const playlistInfo = asyncComputed(() => (playlistId.value ? client.getPlaylist(playlistId.value) : undefined), undefined, loadingInfo)

    const loadingTracks = ref(false)
    const playlistTracksUnordered = asyncComputed(
      () => (playlistId.value ? playlists.getPlaylistTracks(playlistId.value).then(tracks.getTracksWithTempo.bind(tracks)) : []),
      [],
      loadingTracks
    )

    const sorted = ref(true)
    const playlistTracks = computed(() => {
      return sorted.value ? sortBy(playlistTracksUnordered.value, t => t.bpm) : playlistTracksUnordered.value
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
          console.log(i, minBPM, maxBPM)
          groups[`${i}`] = groups[`${i}`] ?? []
        }
      }

      const buckets: [string, number][] = sortBy(
        Object.entries(groups).map(([group, t]) => [group, t.length]),
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
              'rgba(201, 203, 207, 0.2)',
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
              'rgb(201, 203, 207)',
            ],
            borderWidth: 1,
          },
        ],
      }
    })

    async function play(track: TrackWithBPM) {
      await client.queue('spotify:track:' + track.id)
      setTimeout(async () => {
        await client.skipToNext()
      }, 500)
    }

    async function onReady() {
      const state = await client.getMyCurrentPlaybackState()
      if (state.context?.type == 'playlist') {
        playlistUrl.value = state.context.external_urls?.spotify ?? ''
      }
    }

    return {
      tracks,
      play,
      loading: reactive({
        info: loadingInfo,
        tracks: loadingTracks,
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
              display: false,
            },
            yAxes: [
              {
                gridLines: {
                  color: 'rgba(255, 255, 255, 0.2)',
                },
                ticks: {
                  fontColor: 'rgba(255, 255, 255, 0.9)',
                },
              },
            ],
            xAxes: [
              {
                gridLines: {
                  color: 'rgba(255, 255, 255, 0.2)',
                },
                ticks: {
                  fontColor: 'rgba(255, 255, 255, 0.9)',
                },
              },
            ],
          },
        },
      }),
      trackFormat,
      sorted,
    }
  },
})
</script>

<style lang="scss"></style>
