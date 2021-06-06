import Spotify from 'spotify-web-api-js'
import { chunk, flatten } from 'lodash'
import { createLocalDB, LocalDB } from '@/local-db'

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

export class TrackDatabase {
  client: Spotify.SpotifyWebApiJs
  db: LocalDB<TrackWithBPM>

  constructor(client: Spotify.SpotifyWebApiJs) {
    this.client = client
    this.db = createLocalDB('t')
  }

  getPlaylistTrackWithTempo({ track }: SpotifyApi.PlaylistTrackObject): Promise<TrackWithBPM> {
    return this.getTrackWithTempo(toSimple(track))
  }

  getTrackWithTempo(track: TrackSimple): Promise<TrackWithBPM> {
    return this.db.getOrCompute(track.id, async () => {
      const { tempo } = await this.client.getAudioFeaturesForTrack(track.id)
      const trackWithBpm = { ...track, bpm: tempo }
      return trackWithBpm
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
}
