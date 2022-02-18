import { useSpotifyState } from './state'
import { whenever } from '@vueuse/core'
import { ref } from '@vue/composition-api'
import { useSpotifyClient } from './auth'
import { createPlaylistInfo, PlaylistInfo } from './playlists'

export function usePresets () {
  const uris = ['00968xdUCWZgRHZqepn8IQ', '031EwXmrqlByHXO3QTd3ji', '5VrKW92gaXcmsYWsY7DyJm']

  const playlists = ref<PlaylistInfo[]>([
    {
      id: '00968xdUCWZgRHZqepn8IQ',
      uri: 'spotify:playlist:00968xdUCWZgRHZqepn8IQ',
      name: 'Bugg',
      description: 'Created by Spotify Agent at 2021-06-13T11:35:56.244Z. Sorted ascending tempo (low to high).',
      image: 'https://mosaic.scdn.co/60/ab67616d0000b27310040db2e027a929f12ce834ab67616d0000b27342d034c00d34332baf7f6c97ab67616d0000b2734ac63692f6efafa9d8e4e4e8ab67616d0000b2736217585c07b7417999f03d92',
      image_large: 'https://mosaic.scdn.co/300/ab67616d0000b27310040db2e027a929f12ce834ab67616d0000b27342d034c00d34332baf7f6c97ab67616d0000b2734ac63692f6efafa9d8e4e4e8ab67616d0000b2736217585c07b7417999f03d92',
      owner: 'tkhduracell',
      size: 3890
    },
    {
      id: '031EwXmrqlByHXO3QTd3ji',
      uri: 'spotify:playlist:031EwXmrqlByHXO3QTd3ji',
      name: 'Lindy Hop',
      description: 'Created by Spotify Agent at 2021-08-15T12:18:05.465Z. Sorted ascending tempo (low to high).',
      image: 'https://mosaic.scdn.co/60/ab67616d0000b2730ed65b0a13870522acd2fd19ab67616d0000b273d4b59d8425c03a27d5a8a5c7ab67616d0000b273de564d17e4eda15c804126dbab67616d0000b273fa31dd7c93406c8aa23c241f',
      image_large: 'https://mosaic.scdn.co/300/ab67616d0000b2730ed65b0a13870522acd2fd19ab67616d0000b273d4b59d8425c03a27d5a8a5c7ab67616d0000b273de564d17e4eda15c804126dbab67616d0000b273fa31dd7c93406c8aa23c241f',
      owner: 'tkhduracell',
      size: 678
    },
    {
      id: '5VrKW92gaXcmsYWsY7DyJm',
      uri: 'spotify:playlist:5VrKW92gaXcmsYWsY7DyJm',
      name: 'Boggie',
      description: 'Created by Spotify Agent at 2021-08-15T12:20:40.201Z. Sorted ascending tempo (low to high).',
      image: 'https://mosaic.scdn.co/60/ab67616d0000b27300dfe5b9f53fd6c4c1df02abab67616d0000b2732f6dbe1f5da69729080d232cab67616d0000b273c422d33814a900200b9d7ea7ab67616d0000b273fa31dd7c93406c8aa23c241f',
      image_large: 'https://mosaic.scdn.co/300/ab67616d0000b27300dfe5b9f53fd6c4c1df02abab67616d0000b2732f6dbe1f5da69729080d232cab67616d0000b273c422d33814a900200b9d7ea7ab67616d0000b273fa31dd7c93406c8aa23c241f',
      owner: 'tkhduracell',
      size: 617
    }
  ])
  const state = useSpotifyState()
  const { client } = useSpotifyClient()

  whenever(() => state.token, async () => {
    const all = await Promise.all(uris.map(u => client.getPlaylist(u)))
    playlists.value = all.map(p => createPlaylistInfo(p)).map(({ name, ...rest }) => ({
      ...rest,
      name: name.replace(/ MASTER.+/gi, '') ?? ''
    }))
  })

  return { uris, playlists }
}
