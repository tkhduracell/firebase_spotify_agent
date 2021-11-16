import Spotify from 'spotify-web-api-js'
import { whenever } from '@vueuse/core'
import { Ref, ref } from '@vue/composition-api'
import { minBy } from 'lodash'

export type PlaylistInfo = { uri: string; name: string; id: string; description: string; image: string; owner: string }

function selectImage (images: SpotifyApi.ImageObject[]): string {
  return minBy(images, i => (i.height ?? 0) - 200)?.url ?? 'https://picsum.photos/200/200'
}

export function usePresets (client: Spotify.SpotifyWebApiJs, ready: Ref<boolean>) {
  const uris = ['00968xdUCWZgRHZqepn8IQ', '031EwXmrqlByHXO3QTd3ji', '5VrKW92gaXcmsYWsY7DyJm']

  const playlists = ref<PlaylistInfo[]>([])

  whenever(ready, async () => {
    const all = await Promise.all(uris.map(u => client.getPlaylist(u)))
    playlists.value = all.map(({ id, uri, name, images, description, owner }) => ({
      id,
      uri,
      name: name ?? '',
      description: description ?? '',
      image: selectImage(images),
      owner: owner.display_name ?? ''
    }))
  })

  return { uris, playlists }
}
