import { SpotifyApi } from './types'
import { SpotifyPlayer as SpotifyPlayerSDK } from 'spotify-web-playback-ts'

type DeviceOpts = { device_id?: string }

export class SpotifyPlayerProxy {
  client: SpotifyApi

  private player: SpotifyPlayerSDK | null = null

  setPlayer (player: SpotifyPlayerSDK | null) {
    console.log('Setting player', player)
    this.player = player
  }

  clearPlayer () {
    console.log('Setting player', null)
    this.player = null
  }

  isFast () {
    return !!this.player
  }

  constructor (client: SpotifyApi) {
    this.client = client
  }

  async setVolume (vol: number, device?: DeviceOpts): Promise<void> {
    const v = parseInt(Math.max(Math.min(vol, 100), 0).toFixed(0))
    if (this.player) {
      return this.player.setVolume(v / 100)
    } else {
      return this.client.setVolume(v, device)
    }
  }

  async getVolume (): Promise<number> {
    if (this.player) {
      return this.player.getVolume()
    } else {
      const state = await this.client.getMyCurrentPlaybackState()
      return state.device.volume_percent ?? 0
    }
  }

  async pause (device?: DeviceOpts): Promise<void> {
    if (this.player) {
      return this.player.pause()
    } else {
      return this.client.pause(device)
    }
  }

  async resume (device?: DeviceOpts): Promise<void> {
    if (this.player) {
      return this.player.resume()
    } else {
      return this.client.play(device)
    }
  }

  async previousTrack (device?: DeviceOpts): Promise<void> {
    if (this.player) {
      return this.player.previousTrack()
    } else {
      return this.client.skipToPrevious(device)
    }
  }

  async nextTrack (device?: DeviceOpts): Promise<void> {
    if (this.player) {
      return this.player.nextTrack()
    } else {
      return this.client.skipToNext(device)
    }
  }
}
