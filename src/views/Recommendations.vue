<template>
  <b-container fluid="lg" class="recs">
    <b-row>
      <b-col>
        <h1>Song finder</h1>
        <p>
          Here you can find new songs based on artficial intelligense. Fiddle with the data points below to get different recommendations.
        </p>
      </b-col>
    </b-row>
    <b-row align-h="center">
      <b-col cols="3">
        <b-row class="h-100" align-h="center" align-content="center" align-v="center">
          <b-col cols="auto" @click="tempo = Math.min(tempo - step, 210)"><b-icon-dash scale='3.0'/></b-col>
          <b-col cols="auto"><div class="tempo">{{ tempo }}</div></b-col>
          <b-col cols="auto" @click="tempo = Math.max(tempo + step, 80)"><b-icon-plus scale='3.0'/></b-col>
        </b-row>
      </b-col>
      <b-col cols="3">
        <b-form-group label="Artists (max 5)" v-slot="{ ariaDescribedby }">
          <b-form-checkbox-group
            v-model="seed_artists"
            :options="options_artists"
            name="seed_artists"
            :aria-describedby="ariaDescribedby"
          />
        </b-form-group>
      </b-col>
      <b-col cols="3">
        <b-form-group label="Tracks (max 5)" v-slot="{ ariaDescribedby }">
          <b-form-checkbox-group v-model="seed_artists" :options="options_tracks" name="seed_tracks" :aria-describedby="ariaDescribedby" />
        </b-form-group>
      </b-col>
      <b-col cols="3">
        <b-form-group label="Genres (max 5)" v-slot="{ ariaDescribedby }">
          <b-form-checkbox-group v-model="seed_artists" :options="options_genres" name="seed_genres" :aria-describedby="ariaDescribedby" />
        </b-form-group>
      </b-col>
    </b-row>
    <b-row class="state mt-4" v-if="tracks && recs">
      <b-col cols="12" v-for="t in tracks" :key="t.id">
        <div class="d-flex flex-wrap">
          <b-link class="" variant="link" href="#" @click="play(t)">{{ t.bpm.toFixed() }} - {{ t.artist }} - {{ t.title }} </b-link>
        </div>
      </b-col>
    </b-row>
    <b-row v-else-if="error">
      <b-col>
        {{ error }}
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
import { computed, defineComponent, onMounted, ref, watch } from '@vue/composition-api'
import { TrackWithBPM, TrackDatabase } from '@/tracks'
import { useSpotifyClient } from '@/auth'
import { SpotifyApi } from '@/types'
import { useSpotifyState } from '@/state'

export default defineComponent({
  name: 'Recommendation',
  components: {},
  setup () {
    const { client } = useSpotifyClient()
    const state = useSpotifyState()
    const token = computed(() => state.token)

    const db = new TrackDatabase(client)

    const tempo = ref<number>(160)
    const recs = ref<SpotifyApi.RecommendationsObject>()
    const error = ref<any>()

    const options_artists = [
      { value: 'spotify:artist:4rMk4gSVtsxoOb7NPwF6hA', text: 'Donnez' },
      { value: 'spotify:artist:3MjqsvJtWHZFbk4bEAaskX', text: 'Streaplers' },
      { value: 'spotify:artist:29JwBerAT0YALGfItKsEbT', text: 'Casanovas' },
      { value: 'spotify:artist:53gEW5pRU9o1oYP0iMgHk7', text: 'Claes Lövgrens' },
      { value: 'spotify:artist:7mTV1xDo95GO6Bc7ttBFm8', text: 'Sannex' },
      { value: 'spotify:artist:3fOgHwbiAAOouhhFf9yS8W', text: 'Blender' },
      { value: 'spotify:artist:3fem2e3Zze52UJL9TvT8r9', text: 'SDM' },
      { value: 'spotify:artist:0ntVZReCfBFQctUiiaTaeu', text: 'Lasse Stefanz' },
      { value: 'spotify:artist:69nQmMVKUKXmuYWC8aucZf', text: 'Skåningarna' },
      {
        value: 'spotify:artist:3ktAhWMnoYiz6UpBEKfv5i',
        text: 'Kikki Danielsson'
      }
    ]
    const seed_artists = ref<string[]>([
      options_artists[0].value,
      options_artists[1].value,
      options_artists[2].value,
      options_artists[4].value,
      options_artists[5].value
    ])

    const options_tracks = [
      {
        value: 'spotify:track:1qwQjUYCcYW3qD7ilRHcF2',
        text: 'Accordition Thing'
      },
      {
        value: 'spotify:track:4QB01XWrPARKASCUJzbI8U',
        text: 'På Min Balkong'
      },
      {
        value: 'spotify:track:63oxarpk0RN7jJn1w9aUE0',
        text: 'Dags Att Leka Klart'
      },
      {
        value: 'spotify:track:1rKI0D9ilAB88TPx7trjix',
        text: 'Det Var Bättre Förr'
      },
      {
        value: 'spotify:track:4cD8na4gzqJzD5uhqmpskP',
        text: 'Lite mer av din tid'
      }
    ]
    const seed_tracks = ref<string[]>([])

    const options_genres = ['pop', 'swedish', 'folk', 'honky-tonk', 'country']
    const seed_genres = ref<string[]>([])

    const tracks = ref<TrackWithBPM[]>()
    const isWithin = (v: number, min: number, max: number) => v >= min && v <= max

    watch(recs, async r => {
      const res = await Promise.all((r?.tracks ?? []).map(t => db.getTrackWithTempo(t.id)))
      tracks.value = !r && res ? [] : res
        .filter(t => isWithin(t.bpm, tempo.value * 0.7, tempo.value * 1.3))
        .sort((lhs, rhs) => lhs.bpm - rhs.bpm)
    })

    async function play (track: TrackWithBPM) {
      if (state.device_id) {
        await client.queue('spotify:track:' + track.id)
        setTimeout(async () => {
          await client.skipToNext()
        }, 500)
      } else {
        console.log('No device to play on!')
      }
    }

    async function onReady () {
      recs.value = undefined
      error.value = undefined
      try {
        recs.value = await client.getRecommendations({
          market: 'SE',
          limit: 40,
          seed_artists: seed_artists.value.map(opt => opt.split(':')[2]),
          seed_genres: seed_genres.value,
          seed_tracks: seed_tracks.value.map(uri => uri.split(':')[2]),
          target_tempo: tempo.value
        })
      } catch (e) {
        const req = e as XMLHttpRequest
        error.value = JSON.parse(req.response)
      }
    }

    watch([token, tempo, seed_artists, seed_tracks, seed_genres], () => {
      if (token.value) onReady()
    })

    onMounted(() => {
      if (token.value) onReady()
    })

    return {
      recs,
      error,
      tracks,
      tempo,
      play,

      options_tracks,
      options_artists,
      options_genres,

      seed_tracks,
      seed_artists,
      seed_genres,

      step: 5
    }
  }
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
    'world-music'
  ]
}
</script>

<style lang="scss">
.tempo {
  font-size: 300%;
}
</style>
