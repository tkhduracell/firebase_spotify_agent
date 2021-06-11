import { TrackWithBPM } from './tracks'

export type QueueState = {
  loading: boolean | string
  sent: boolean
  track: TrackWithBPM | undefined
  pool: number
}

export type ProgressFn = (i: number, tot: number) => void
