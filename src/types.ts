import { TrackWithBPM } from './tracks'

export type QueueState = {
  loading: boolean
  sent: boolean
  track: TrackWithBPM | undefined
  pool: number
}
