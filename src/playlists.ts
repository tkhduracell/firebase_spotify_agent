import Spotify from 'spotify-web-api-js'
import { toSimple, TrackSimple } from './tracks'
import { createLocalDB, LocalDB } from '@/local-db'
import { ProgressFn } from './types'
import { Timer } from './timer'
import { sleep } from './sleep'
import { minBy } from 'lodash'

export class PlaylistDatabase {
  client: Spotify.SpotifyWebApiJs
  db: LocalDB<string[]>
  tdb: LocalDB<TrackSimple>

  constructor (client: Spotify.SpotifyWebApiJs) {
    this.client = client
    this.db = createLocalDB('pl-trx')
    this.tdb = createLocalDB('t')
  }

  async getPlaylistTracks (id: string, progress?: ProgressFn, requested?: string): Promise<string[]> {
    const { snapshot_id: current } = await this.client.getPlaylist(id, {
      fields: 'snapshot_id',
      market: 'SE'
    })

    if (requested && current !== requested) {
      throw new Error('Incorrect version')
    }

    const [previous] = await this.db.getOrCompute(`${id}:version`, async () => [current])

    // Prune saved if changed snapshot
    if (current !== previous) {
      console.log('[playlist] Playlist', id, 'has changed, clearing saved...', previous, '->', current)
      this.db.clear(id)
      this.db.clear(`${id}:version`)
    }

    return this.db.getOrCompute(id, () => this.fetchPlaylist(id, progress))
  }

  private async fetchPlaylist (id: string, progress?: ProgressFn): Promise<string[]> {
    const timer = new Timer('[playlist] ')

    const { items, next, total } = await this.client.getPlaylistTracks(id, {
      fields: 'next,total,items(is_local,track(id,name,artists(name),is_playable))',
      market: 'SE'
    })
    let all = items.filter(t => t !== null && !t.is_local && t.track.is_playable).map(i => toSimple(i.track))

    if (progress) {
      progress(all.length, total)
    }

    let i = 0
    let cursor = next
    while (cursor && i++ < 100) {
      await sleep(100)

      const { items, next } = (await this.client.getGeneric(cursor)) as SpotifyApi.PlaylistTrackResponse
      const plucked = items.filter(i => i !== null && !i.is_local && i.track.is_playable).map(i => toSimple(i.track))
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

export type PlaylistInfo = { uri: string; name: string; id: string; description: string; image: string; image_large: string; owner: string, size: number }

function selectImageSmall (images: SpotifyApi.ImageObject[]): string {
  return minBy(images, i => Math.abs((i.height ?? 0) - 150))?.url ?? 'https://picsum.photos/200/200'
}
function selectImageLarge (images: SpotifyApi.ImageObject[]): string {
  return minBy(images, i => Math.abs((i.height ?? 0) - 300))?.url ?? 'https://picsum.photos/400/400'
}

export function createPlaylistInfo ({ id, uri, name, images, description, owner, tracks }: SpotifyApi.PlaylistObjectSimplified): PlaylistInfo {
  return {
    id,
    uri,
    name: name ?? '',
    description: description ?? '',
    image: selectImageSmall(images),
    image_large: selectImageLarge(images),
    owner: owner.display_name ?? '',
    size: tracks.total
  }
}
