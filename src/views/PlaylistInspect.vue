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
              <b-form-checkbox v-model="sorted" class="mt-1">
                Sort by tempo?
              </b-form-checkbox>
            </b-col>
          </b-form-row>
        </b-form>
      </b-col>
    </b-row>
    <b-row class="mt-3">
      <b-col order="1" cols="12" md="12" offset-md="0" lg="6" order-lg="1" v-if="loading.info || !playlist.info">
        <b-spinner />
      </b-col>
      <b-col order="1" cols="12" md="12" offset-md="0" lg="6" order-lg="1" v-else>
        <h2 v-text="playlist.info.name" />
        <p v-if="playlist.tracks.length > 0" v-text="`${playlist.tracks.length} songs`" />
        <p v-if="playlist.info.description" v-text="playlist.info.description" class="small" />

        <b-spinner v-if="loading.tracks" />
        <div v-if="playlist.tracks.length > 0">
          <div v-for="(t, idx) in playlist.tracks" :key="idx + t.id">
            <div class="row">
              <b-link @click="play(t)" class="col-12 text-truncate" >
                {{ trackFormat(t, true) }} <b-icon-play v-if="state && state.item && t.id == state.item.id" />
              </b-link>
            </div>
          </div>
        </div>
      </b-col>
      <b-col order="0" cols="12" sm="8" offset-sm="2" md="8" offset-md="2" lg="6" order-lg="2" offset-lg="0" xl="4" class="">
        <h2>Tracks per tempo</h2>
        <BarChart v-bind="barChartProps" />
      </b-col>
    </b-row>
  </b-container>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, watch } from '@vue/composition-api'

import { TrackWithBPM, TrackDatabase, trackFormat } from '@/tracks'

import { PlaylistDatabase } from '@/playlists'

import { asyncComputed } from '@vueuse/core'
import { sortBy, groupBy, range, max, min } from 'lodash'
import { BarChart, useBarChart } from 'vue-chart-3'
import { useSpotifyAuth, useSpotifyClient } from '@/auth'
import { usePlaybackState } from '@/playing'

export default defineComponent({
  name: 'PlaylistInspect',
  components: { BarChart },
  setup (props, { root: { $route } }) {
    const { reauth } = useSpotifyAuth($route, false)
    const { client } = useSpotifyClient()
    const { state } = usePlaybackState(client, reauth)

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
    const chartData = computed(() => {
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

    const options = {
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
    const { barChartProps } = useBarChart({ chartData, options })

    async function play (track: TrackWithBPM) {
      await client.queue('spotify:track:' + track.id)
      setTimeout(async () => {
        await client.skipToNext()
      }, 500)
    }

    watch(state, (s) => {
      if (s && s.context?.type === 'playlist') {
        playlistUrl.value = s.context.external_urls?.spotify ?? ''
      }
    })

    return {
      tracks,
      play,
      state,
      loading: reactive({
        info: loadingInfo,
        tracks: loadingTracks
      }),
      playlist: reactive({
        url: playlistUrl,
        id: playlistId,
        tracks: playlistTracks,
        info: playlistInfo
      }),
      trackFormat,
      sorted,
      barChartProps
    }
  }
})
</script>

<style lang="scss"></style>
