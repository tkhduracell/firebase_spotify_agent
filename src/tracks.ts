import Spotify from 'spotify-web-api-js'
import { chunk } from 'lodash'
import { createLocalDB, LocalDB } from '@/local-db'
import { collection, Firestore, getDoc, getFirestore, setDoc } from '@firebase/firestore'
import { doc, getDocs } from 'firebase/firestore'
import { ProgressFn } from './types'
import { Timer } from './timer'
import { sleep } from './sleep'

export type TrackSimple = { title: string; artist: string; id: string }
export type TrackWithBPM = TrackSimple & { bpm: number }

export function toSimple (track: SpotifyApi.PlaylistTrackObject['track'] | SpotifyApi.PlayHistoryObject['track']): TrackSimple {
  const type = track.type ?? 'track'
  if (type === 'track') {
    const { id, name: title, artists } = track as SpotifyApi.TrackObjectSimplified
    return {
      id,
      title,
      artist: artists.map(s => s.name).join(', ')
    }
  } else {
    const { id, name: title } = track as SpotifyApi.EpisodeObjectSimplified
    return { id, title, artist: 'Podcast' }
  }
}

function trackDoc (f: Firestore, id: string) {
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
function tracksCol (f: Firestore) {
  return collection(f, 'spotify-agent', 'tracks', 'corrections')
}

export class TrackDatabase {
  client: Spotify.SpotifyWebApiJs
  db: LocalDB<TrackWithBPM>
  firestore: Firestore

  constructor (client: Spotify.SpotifyWebApiJs) {
    this.client = client
    this.db = createLocalDB('t')
    this.firestore = getFirestore()
  }

  private async getTempo (id: string): Promise<number> {
    const override = await getDoc(trackDoc(this.firestore, id))
    if (override.exists()) {
      const data = override.data()
      if (id in data) {
        const { bpm } = data[id]
        if (!bpm) {
          console.warn('[tracks] Track', id, 'invalid BPM:', bpm)
        }
        return bpm
      }
    }
    const { tempo: bpm } = await this.client.getAudioFeaturesForTrack(id)
    if (!bpm) {
      console.warn('[tracks] Track', id, 'invalid BPM:', bpm)
    }
    return bpm
  }

  async getTrackWithTempo (id: string): Promise<TrackWithBPM> {
    const track = await this.db.getOrCompute(id, async () => {
      const track = await this.client.getTrack(id)
      return { ...toSimple(track), bpm: await this.getTempo(id) }
    })

    if (!track.bpm) {
      const bpm = await this.getTempo(id)
      this.db.update(id, { bpm })
      return { ...track, bpm }
    }
    return track
  }

  async getTracksWithTempo (tracks: string[], progress?: ProgressFn): Promise<TrackWithBPM[]> {
    const store: Record<string, TrackWithBPM> = {}

    let i = 0
    const missing: Record<string, true> = {}
    for (const id of tracks) {
      const saved = this.db.get(id)
      if (saved) {
        store[id] = saved
        if (saved.bpm === undefined || saved.bpm === null) {
          missing[id] = true
        }
      } else {
        console.warn(`[tracks] Track ${id} is missing in database`)
      }
    }

    if (Object.keys(missing).length > 0) {
      console.log(`[tracks] ${Object.keys(missing).length} is missing tempo`)
    }

    const timer = new Timer('[tracks] ')

    if (progress) {
      progress(i, tracks.length)
    }

    for (const ids of chunk(Object.keys(missing), 100)) {
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

  async updateTrackInfo (id: string, data: TrackWithBPM) {
    console.log('[db] Updating', id, 'with', data)
    await setDoc(trackDoc(this.firestore, id), { [id]: data }, { merge: true })
    if (this.db.has(id)) {
      this.db.set(id, { ...this.db.get(id), ...data })
    }
  }

  async patchTracks () {
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
          console.debug(`[tracks] Patched ${id} with`, patch)
          count++
        }
      }
    }
    timer.log(`firestore patching of ${count} tracks`)
    return out
  }
}
