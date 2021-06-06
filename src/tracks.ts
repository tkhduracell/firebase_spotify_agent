import Spotify from 'spotify-web-api-js'
import { chunk, flatten } from 'lodash'
import { createLocalDB, LocalDB } from '@/local-db'
import { collection, FirebaseFirestore, getDoc, getFirestore, setDoc } from '@firebase/firestore'
import { doc, getDocs } from 'firebase/firestore'

export type TrackSimple = { title: string; artist: string; id: string }
export type TrackWithBPM = TrackSimple & { bpm: number }

export function toSimple(track: SpotifyApi.PlaylistTrackObject['track'] | SpotifyApi.PlayHistoryObject['track']): TrackSimple {
  const type = track.type ?? 'track'
  if (type === 'track') {
    const { id, name: title, artists } = track as SpotifyApi.TrackObjectSimplified
    return {
      id,
      title,
      artist: artists.map(s => s.name).join(', '),
    }
  } else {
    const { id, name: title } = track as SpotifyApi.EpisodeObjectSimplified
    return { id, title, artist: 'Podcast' }
  }
}

function trackDoc(f: FirebaseFirestore, id: string) {
  return doc(
    f,
    'spotify-agent',
    'tracks',
    'corrections',
    `t:${id
      .split('')
      .slice(0, 1)
      .join('')}`
  )
}
function tracksCol(f: FirebaseFirestore) {
  return collection(f, 'spotify-agent', 'tracks', 'corrections')
}

export class TrackDatabase {
  client: Spotify.SpotifyWebApiJs
  db: LocalDB<TrackWithBPM>
  firestore: FirebaseFirestore

  constructor(client: Spotify.SpotifyWebApiJs) {
    this.client = client
    this.db = createLocalDB('t')
    this.firestore = getFirestore()
  }

  getPlaylistTrackWithTempo({ track }: SpotifyApi.PlaylistTrackObject): Promise<TrackWithBPM> {
    return this.getTrackWithTempo(toSimple(track))
  }

  getTrackWithTempo(track: TrackSimple): Promise<TrackWithBPM> {
    return this.db.getOrCompute(track.id, async () => {
      const override = await getDoc(trackDoc(this.firestore, track.id))
      if (override.exists()) {
        const { bpm } = override.data()
        return { ...track, bpm }
      }
      const { tempo: bpm } = await this.client.getAudioFeaturesForTrack(track.id)
      return { ...track, bpm }
    })
  }

  async getTracksWithTempo(tracks: TrackSimple[]): Promise<TrackWithBPM[]> {
    const missing = tracks.filter(t => !this.db.has(t.id))
    const present = tracks.filter(t => this.db.has(t.id))

    const missingChunked = await Promise.all(
      chunk(missing, 100).map(async part => {
        const ids = part.map(s => s.id)
        const result = await this.client.getAudioFeaturesForTracks(ids)

        const out: TrackWithBPM[] = []
        for (const ft of result.audio_features.filter(ft => ft && ft.id)) {
          const simple = part.find(t => t.id === ft.id)
          if (simple && ft.tempo > 0) {
            this.db.set(ft.id, { ...simple, bpm: ft.tempo })
            out.push({ ...simple, bpm: ft.tempo })
          }
        }
        return out
      })
    )
    const fetched = flatten(missingChunked)
    const loaded = await Promise.all(present.map(async t => await this.getTrackWithTempo(t)))

    return [...loaded, ...fetched]
  }

  async updateTrackInfo(id: string, data: TrackWithBPM) {
    console.log('[db] Updating', id, 'with', data)
    await setDoc(trackDoc(this.firestore, id), { [id]: data }, { merge: true })
    if (this.db.has(id)) {
      this.db.set(id, { ...this.db.get(id), ...data })
    }
  }

  async update() {
    const res = await getDocs(tracksCol(this.firestore))
    let count = 0
    for (const doc of res.docs) {
      const data = doc.data() as Record<string, TrackWithBPM>
      const tracks = Object.keys(data)
      for (const id of tracks) {
        if (this.db.has(id)) {
          const patch = data[id]
          const updated = { ...this.db.get(id), ...patch }
          this.db.set(id, updated)
          count++
        }
      }
    }
    console.log('[db] Update database with', count, 'tracks')
  }
}
