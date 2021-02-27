<template>
  <b-container fluid="lg" class="recs">
    <b-row align-h="center">
      <b-col cols="auto">
        <b-form-group label="BPM" v-slot="{ ariaDescribedby }">
          <b-spinbutton
            v-model="tempo"
            min="80"
            max="210"
            step="5"
            :aria-describedby="ariaDescribedby"
          />
        </b-form-group>
      </b-col>
      <b-col cols="3">
        <b-form-group label="Artists" v-slot="{ ariaDescribedby }">
          <b-form-checkbox-group
            v-model="seed_artists"
            :options="options_artists"
            name="seed_artists"
            :aria-describedby="ariaDescribedby"
          />
        </b-form-group>
      </b-col>
      <b-col cols="3">
        <b-form-group label="Genres" v-slot="{ ariaDescribedby }">
          <b-form-checkbox-group
            v-model="seed_artists"
            :options="options_genres"
            name="seed_genres"
            :aria-describedby="ariaDescribedby"
          />
        </b-form-group>
      </b-col>
      <b-col cols="3">
        <b-form-group label="Tracks" v-slot="{ ariaDescribedby }">
          <b-form-checkbox-group
            v-model="seed_artists"
            :options="options_tracks"
            name="seed_tracks"
            :aria-describedby="ariaDescribedby"
          />
        </b-form-group>
      </b-col>
    </b-row>
    <b-row class="state mt-4" v-if="tracks && recs">
      <b-col cols="12" v-for="t in tracks" :key="t.id">
        <div class="d-flex flex-wrap">
          <b-link class="" variant="link" href="#" @click="play(t)"
            >{{ t.bpm.toFixed() }} - {{ t.artist }} - {{ t.title }}
          </b-link>
        </div>
      </b-col>
    </b-row>
    <b-row v-else>
      <b-col>
        <b-spinner variant="primary" class="mt-2" />
      </b-col>
    </b-row>
  </b-container>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/camelcase */
import { defineComponent, ref, watch } from '@vue/composition-api'

import { TrackWithBPM, TrackDatabase, toSimple } from '@/tracks'
import { useSpotifyRedirect } from '@/auth'

export default defineComponent({
  name: 'Recommendation',
  components: {},
  setup(props, { root: { $route } }) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const { client } = useSpotifyRedirect($route, onReady)

    const db = new TrackDatabase(client)

    const tempo = ref<number>(160)
    const recs = ref<SpotifyApi.RecommendationsObject>()

    const options_artists = [
      { value: 'spotify:artist:4rMk4gSVtsxoOb7NPwF6hA', text: 'Donnez' },
      { value: 'spotify:artist:3MjqsvJtWHZFbk4bEAaskX', text: 'Streaplers' },
      { value: 'spotify:artist:29JwBerAT0YALGfItKsEbT', text: 'Casanovas' },
      // eslint-disable-next-line prettier/prettier
      { value: 'spotify:artist:53gEW5pRU9o1oYP0iMgHk7', text: 'Claes Lövgrens' },
      { value: 'spotify:artist:7mTV1xDo95GO6Bc7ttBFm8', text: 'Sannex' },
      { value: 'spotify:artist:3fOgHwbiAAOouhhFf9yS8W', text: 'Blender' },
      { value: 'spotify:artist:3fem2e3Zze52UJL9TvT8r9', text: 'SDM' },
      { value: 'spotify:artist:0ntVZReCfBFQctUiiaTaeu', text: 'Lasse Stefanz' },
      { value: 'spotify:artist:69nQmMVKUKXmuYWC8aucZf', text: 'Skåningarna' },
      {
        value: 'spotify:artist:3ktAhWMnoYiz6UpBEKfv5i',
        text: 'Kikki Danielsson',
      },
    ]
    const seed_artists = ref<string[]>([
      options_artists[0].value,
      options_artists[1].value,
      options_artists[2].value,
      options_artists[4].value,
      options_artists[5].value,
    ])

    const options_tracks = [
      {
        value: 'spotify:track:1qwQjUYCcYW3qD7ilRHcF2',
        text: 'Accordition Thing',
      },
      {
        value: 'spotify:track:4QB01XWrPARKASCUJzbI8U',
        text: 'På Min Balkong',
      },
      {
        value: 'spotify:track:63oxarpk0RN7jJn1w9aUE0',
        text: 'Dags Att Leka Klart',
      },
      {
        value: 'spotify:track:1rKI0D9ilAB88TPx7trjix',
        text: 'Det Var Bättre Förr',
      },
      {
        value: 'spotify:track:4cD8na4gzqJzD5uhqmpskP',
        text: 'Lite mer av din tid',
      },
    ]
    const seed_tracks = ref<string[]>([])

    const options_genres = ['pop', 'swedish', 'folk', 'honky-tonk', 'country']
    const seed_genres = ref<string[]>([])

    const tracks = ref<TrackWithBPM[]>()
    watch(recs, async r => {
      tracks.value = !r
        ? []
        : await Promise.all(
            r.tracks.map(t => db.getTrackWithTempo(toSimple(t)))
          )
    })

    async function play(track: TrackWithBPM) {
      await client.queue('spotify:track:' + track.id)
      setTimeout(async () => {
        await client.skipToNext()
      }, 500)
    }

    async function onReady() {
      recs.value = undefined
      recs.value = await client.getRecommendations({
        market: 'SE',
        limit: 40,
        seed_artists: seed_artists.value.map(opt => opt.split(':')[2]),
        seed_genres: seed_genres.value,
        seed_tracks: seed_tracks.value.map(uri => uri.split(':')[2]),
        target_tempo: tempo.value,
      })
    }

    watch([tempo, seed_artists, seed_tracks, seed_genres], () => onReady())

    return {
      recs,
      tracks,
      tempo,
      play,

      options_tracks,
      options_artists,
      options_genres,

      seed_tracks,
      seed_artists,
      seed_genres,
    }
  },
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const a = {
  genres: [
    'acoustic',
    'afrobeat',
    'alt-rock',
    'alternative',
    'ambient',
    'anime',
    'black-metal',
    'bluegrass',
    'blues',
    'bossanova',
    'brazil',
    'breakbeat',
    'british',
    'cantopop',
    'chicago-house',
    'children',
    'chill',
    'classical',
    'club',
    'comedy',
    'country',
    'dance',
    'dancehall',
    'death-metal',
    'deep-house',
    'detroit-techno',
    'disco',
    'disney',
    'drum-and-bass',
    'dub',
    'dubstep',
    'edm',
    'electro',
    'electronic',
    'emo',
    'folk',
    'forro',
    'french',
    'funk',
    'garage',
    'german',
    'gospel',
    'goth',
    'grindcore',
    'groove',
    'grunge',
    'guitar',
    'happy',
    'hard-rock',
    'hardcore',
    'hardstyle',
    'heavy-metal',
    'hip-hop',
    'holidays',
    'honky-tonk',
    'house',
    'idm',
    'indian',
    'indie',
    'indie-pop',
    'industrial',
    'iranian',
    'j-dance',
    'j-idol',
    'j-pop',
    'j-rock',
    'jazz',
    'k-pop',
    'kids',
    'latin',
    'latino',
    'malay',
    'mandopop',
    'metal',
    'metal-misc',
    'metalcore',
    'minimal-techno',
    'movies',
    'mpb',
    'new-age',
    'new-release',
    'opera',
    'pagode',
    'party',
    'philippines-opm',
    'piano',
    'pop',
    'pop-film',
    'post-dubstep',
    'power-pop',
    'progressive-house',
    'psych-rock',
    'punk',
    'punk-rock',
    'r-n-b',
    'rainy-day',
    'reggae',
    'reggaeton',
    'road-trip',
    'rock',
    'rock-n-roll',
    'rockabilly',
    'romance',
    'sad',
    'salsa',
    'samba',
    'sertanejo',
    'show-tunes',
    'singer-songwriter',
    'ska',
    'sleep',
    'songwriter',
    'soul',
    'soundtracks',
    'spanish',
    'study',
    'summer',
    'swedish',
    'synth-pop',
    'tango',
    'techno',
    'trance',
    'trip-hop',
    'turkish',
    'work-out',
    'world-music',
  ],
}
</script>

<style lang="scss"></style>
