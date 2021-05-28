import Spotify from 'spotify-web-api-js'
import { toSimple, TrackSimple } from './tracks'

export class PlaylistDatabase {
  client: Spotify.SpotifyWebApiJs

  constructor(client: Spotify.SpotifyWebApiJs) {
    this.client = client
  }

  async getPlaylist(id: string): Promise<TrackSimple[]> {
    const pl = window.localStorage.getItem(id)
    if (pl) {
      return JSON.parse(pl)
    } else {
      const fetched = await this.fetchPlaylist(id)
      localStorage.setItem(id, JSON.stringify(fetched))
      return fetched
    }
  }

  private async fetchPlaylist(id: string): Promise<TrackSimple[]> {
    const { items, next } = await this.client.getPlaylistTracks(id, {
      fields: 'limit,next,offset,previous,total,items(track(id,name,artists(name)))',
    })

    let all = items.map(i => toSimple(i.track))
    let i = 0
    let cursor = next
    while (cursor && i++ < 100) {
      const { items, next } = (await this.client.getGeneric(cursor)) as SpotifyApi.PlaylistTrackResponse
      const plucked = items.map(i => toSimple(i.track))
      all = [...all, ...plucked]
      cursor = next
    }
    return all
  }
}
