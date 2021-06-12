import Spotify from 'spotify-web-api-js'
import { toSimple, TrackSimple } from './tracks'
import { createLocalDB, LocalDB } from '@/local-db'
import { ProgressFn } from './types'
import { Timer } from './timer'
import { sleep } from './sleep'

export class PlaylistDatabase {
  client: Spotify.SpotifyWebApiJs
  db: LocalDB<string[]>
  tdb: LocalDB<TrackSimple>

  constructor(client: Spotify.SpotifyWebApiJs) {
    this.client = client
    this.db = createLocalDB('pl-trx')
    this.tdb = createLocalDB('t')
  }

  async getPlaylistTracks(id: string, progress?: ProgressFn): Promise<string[]> {
    return this.db.getOrCompute(id, () => this.fetchPlaylist(id, progress))
  }

  private async fetchPlaylist(id: string, progress?: ProgressFn): Promise<string[]> {
    const timer = new Timer('[playlist] ')

    const { items, next, total } = await this.client.getPlaylistTracks(id, {
      fields: 'next,total,items(is_local,track(id,name,artists(name)))',
      market: 'SE',
    })
    let all = items.map(i => toSimple(i.track))

    if (progress) {
      progress(all.length, total)
    }

    let i = 0
    let cursor = next
    while (cursor && i++ < 100) {
      await sleep(100)

      const { items, next } = (await this.client.getGeneric(cursor)) as SpotifyApi.PlaylistTrackResponse
      const plucked = items.filter(i => !i.is_local).map(i => toSimple(i.track))
      all = [...all, ...plucked]

      if (progress) {
        progress(all.length, total)
      }

      cursor = next
    }

    timer.log(`${all.length} track lookups`)

    for (const track of all) {
      this.tdb.set(track.id, track)
    }

    return all.map(t => t.id)
  }
}
