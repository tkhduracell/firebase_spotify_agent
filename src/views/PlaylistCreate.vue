<template>
  <b-container fluid="lg" class="recs">
    <b-row>
      <b-col>
        <h1>Playlist Creator</h1>
        <p>
          Add playlists here to join then into a single one. Removing duplicates and sorting them by tempo. Press the create below to create
          it.
        </p>
        <b-form>
          <b-form-row>
            <b-col cols="6">
              <b-form-group v-for="(url, key) in form.urls" :key="key" :description="description(url.value)">
                <b-input-group size="sm" class="mb-2">
                  <b-input-group-prepend is-text>
                    {{ key }}
                  </b-input-group-prepend>
                  <b-form-input type="text" v-model="url.value" lazy-formatter :formatter="clean" />
                </b-input-group>
              </b-form-group>
              <b-link @click.prevent="add"><b-icon-plus /> Add one more</b-link>
            </b-col>
          </b-form-row>
        </b-form>
      </b-col>
    </b-row>

    <b-row class="mt-3">
      <b-col cols="6">
        <div v-for="p in playlists" :key="p.id">
          <h2 v-text="p.info.name" />
          <p v-if="p.tracks.length > 0" v-text="`${p.tracks.length} songs`" />
          <p v-if="p.info" v-text="p.info.description" />
          <div v-if="p.tracks.length > 0">
            <div v-for="(t, idx) in p.tracks" :key="idx + t.id">
              <b-link @click="play(t)">{{ trackFormat(t, true) }} </b-link>
            </div>
          </div>
        </div>
      </b-col>
      <b-col cols="6">
        <h2>
          Generated playlist
          <b-button size="sm" variant="primary" class="mb-1" @click="create('Generated playlist')">Create</b-button>
        </h2>
        <p v-text="`${master.length} songs (${master.total - master.length} removed)`" />
        <div v-if="master.length > 0">
          <div v-for="t in master.tracks" :key="'master-' + t.id">
            <b-link @click="play(t)">
              {{ trackFormat(t, true) }}
              <b-icon-exclamation-triangle class="text-danger" v-if="master.duplicates[t.id]" />
            </b-link>
          </div>
        </div>
      </b-col>
    </b-row>
  </b-container>
</template>

<script lang="ts">
import { defineComponent, reactive, computed, Ref, watch } from '@vue/composition-api'

import { TrackWithBPM, TrackDatabase, trackFormat } from '@/tracks'
import { useSpotifyClient } from '@/auth'
import { PlaylistDatabase } from '@/playlists'
import { createLocalDB, VERSION } from '@/local-db'
import { SpotifyApi } from '@/types'
import { asyncComputed, useStorage } from '@vueuse/core'

import { uniq, sortBy, flatten, uniqBy, chunk, groupBy, filter, fromPairs } from 'lodash'
import { usePlaybackState } from '@/playing'

function id (url: string): string {
  return url.replace(/https:\/\/open\.spotify\.com\/playlist\/(\w{20,24})(\?.+)?/i, '$1')
}
function clean (url: string): string {
  return url.replace(/(https:\/\/open\.spotify\.com\/playlist\/\w{20,24})(\?.+)?/i, '$1')
}

export default defineComponent({
  name: 'PlaylistCreate',
  setup (props, { root: { $router } }) {
    const form = useStorage(VERSION + ':pl-urls', {
      urls: [{ value: '' }] as { value: string }[]
    }) as unknown as Ref<{ urls: { value: string }[] }>

    const { client } = useSpotifyClient()
    const { state } = usePlaybackState(client, 5000)

    const tracksDB = new TrackDatabase(client)
    const playlistsDB = new PlaylistDatabase(client)

    watch(() => state.value?.context, ctx => {
      if (ctx && ctx.type === 'playlist') {
        if (!form.value.urls[0].value) {
          form.value.urls[0].value = ctx.external_urls?.spotify ?? ''
        }
      }
    })

    const playlistInfo = createLocalDB<SpotifyApi.SinglePlaylistResponse>('pl-meta')

    const playlists = asyncComputed(async () => {
      const urls = form.value.urls.map(f => id(f.value))

      try {
        await client.getMe()
      } catch (error) {
        return []
      }

      return Promise.all(
        uniq(urls)
          .filter(id => id.match(/^\w{20,24}$/i))
          .map(async id => {
            const [info, tracks] = await Promise.all([
              playlistInfo.getOrCompute(id, () =>
                client.getPlaylist(id, { fields: 'name,description,uri,owner.id,public,type', market: 'SE' })
              ),
              playlistsDB.getPlaylistTracks(id).then(tracksDB.getTracksWithTempo.bind(tracksDB))
            ])
            return { id, info, tracks: sortBy(tracks, ['bpm', 'artist']) }
          })
      )
    }, [])

    const master = computed(() => {
      const flat = flatten(playlists.value.map(p => p.tracks))
      const tracks = sortBy(
        uniqBy(sortBy(flat, ['bpm', 'artist']), t => t.id),
        ['bpm', 'artist']
      )

      const duplicates = fromPairs(
        flatten(
          filter(
            groupBy(tracks, t => t.title.toLowerCase() + t.artist.toLowerCase()),
            group => group.length >= 2
          )
        ).map(t => [t.id, true])
      )

      return { tracks, length: tracks.length, total: flat.length, duplicates }
    })

    function description (url: string): string {
      const _id = id(url)
      const info = playlists.value.find(p => p.id === _id)?.info
      return info?.name ?? '...'
    }

    return {
      form,
      master,
      add: function () {
        const v = reactive({ value: '' })
        form.value.urls.push(v)
      },
      play: function (t: TrackWithBPM) {
        const { id } = t
        client.play({ context_uri: `spotify:track:${id}` })
      },
      playlists,
      trackFormat,
      description,
      clean,
      async create (name: string) {
        const user = await client.getMe()
        const playlist = await client.createPlaylist(user.id, {
          name,
          public: false,
          description: `Created by Spotify Agent at ${new Date().toISOString()}. Sorted ascending tempo (low to high).`
        })
        const chunks = chunk(master.value.tracks, 100)
        for (const part of chunks) {
          const uris = part.map(t => `spotify:track:${t.id}`)
          await client.addTracksToPlaylist(playlist.id, uris)
        }
      }
    }
  }
})
</script>

<style lang="scss">
.input-group {
  .form-text {
    position: relative;
    top: -4px;
    color: red;
  }
}
</style>
