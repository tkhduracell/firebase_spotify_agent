import Spotify from 'spotify-web-api-js'
import { chunk } from 'lodash'
import { createLocalDB, LocalDB } from '@/local-db'
import { collection, FirebaseFirestore, getDoc, getFirestore, setDoc } from '@firebase/firestore'
import { doc, getDocs } from 'firebase/firestore'
import { ProgressFn } from './types'
import { Timer } from './timer'

export type TrackSimple = { title: string; artist: string; id: string }
export type TrackWithBPM = TrackSimple & { bpm: number }

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

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

  async getTracksWithTempo(tracks: string[], progress?: ProgressFn): Promise<TrackWithBPM[]> {
    const store: Record<string, TrackWithBPM> = {}

    let i = 0
    const missing = new Set<string>()
    for (const id of tracks) {
      const track = this.db.get(id)
      if (track) {
        store[id] = track
        if (!track.bpm) {
          missing.add(id)
        }
      } else {
        console.warn(`[tracks] Track ${id} is missing in database`)
      }
    }

    const timer = new Timer('[tracks] ')

    if (progress) {
      progress(i, tracks.length)
    }

    for (const ids of chunk(Array.from(missing), 100)) {
      const result = await this.client.getAudioFeaturesForTracks(ids)

      for (const { id, tempo: bpm } of result.audio_features.filter(ft => ft && ft.id && ft.tempo > 0)) {
        this.db.update(id, { bpm })
        store[id] = { ...store[id], bpm }
      }

      i += ids.length
      if (progress) {
        progress(i, tracks.length)
      }

      await sleep(100)
    }

    timer.log(`${i} BPM lookups`)

    const changes = await this.patchTracks()

    for (const [id, track] of Object.entries(changes)) {
      store[id] = track
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return tracks.filter(id => !!(id in store)).map(id => store[id])
  }

  async updateTrackInfo(id: string, data: TrackWithBPM) {
    console.log('[db] Updating', id, 'with', data)
    await setDoc(trackDoc(this.firestore, id), { [id]: data }, { merge: true })
    if (this.db.has(id)) {
      this.db.set(id, { ...this.db.get(id), ...data })
    }
  }

  async patchTracks() {
    const timer = new Timer('[tracks] ')
    const res = await getDocs(tracksCol(this.firestore))
    let count = 0
    const out: Record<string, TrackWithBPM> = {}
    for (const doc of res.docs) {
      const data = doc.data() as Record<string, TrackWithBPM>
      const tracks = Object.keys(data)
      for (const id of tracks) {
        if (this.db.has(id)) {
          const patch = data[id]
          const updated = { ...this.db.get(id), ...patch }
          this.db.set(id, updated)
          out[id] = updated
          count++
        }
      }
    }
    timer.log(`firestore patching of ${count} tracks`)
    return out
  }
}
