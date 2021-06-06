import Spotify from 'spotify-web-api-js'
import { toSimple, TrackSimple } from './tracks'
import { createLocalDB, LocalDB } from '@/local-db'

export class PlaylistDatabase {
  client: Spotify.SpotifyWebApiJs
  db: LocalDB<TrackSimple[]>

  constructor(client: Spotify.SpotifyWebApiJs) {
    this.client = client
    this.db = createLocalDB('pl-trx')
  }

  async getPlaylist(id: string): Promise<TrackSimple[]> {
    return this.db.getOrCompute(id, () => this.fetchPlaylist(id))
  }

  private async fetchPlaylist(id: string): Promise<TrackSimple[]> {
    const { items, next } = await this.client.getPlaylistTracks(id, {
      fields: 'limit,next,offset,previous,total,items(is_local,track(id,name,artists(name)))',
      market: 'SE',
    })

    let all = items.map(i => toSimple(i.track))
    let i = 0
    let cursor = next
    while (cursor && i++ < 100) {
      const { items, next } = (await this.client.getGeneric(cursor)) as SpotifyApi.PlaylistTrackResponse
      const plucked = items.filter(i => !i.is_local).map(i => toSimple(i.track))
      all = [...all, ...plucked]
      cursor = next
    }
    return all
  }
}
