import SpotifyWebApi from 'spotify-web-api-js'
import { TrackWithBPM } from './tracks'

export type QueueState = {
  loading: boolean | string
  sent: boolean
  track: TrackWithBPM | undefined
  pool: number
}

export type ProgressFn = (i: number, tot: number) => void
export type SpotifyApi = SpotifyWebApi.SpotifyWebApiJs
export const SpotifyApi = SpotifyWebApi
