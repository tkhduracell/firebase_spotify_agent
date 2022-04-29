import { reactive } from '@vue/composition-api'

import { SpotifyPlayerProxy } from './player-proxy'

export function useVolume (player: SpotifyPlayerProxy) {
  const fading = reactive({
    fadedown: false,
    fadeup: false,
    volume: 0 as number | null | undefined
  })

  async function startFadeUp (options?: SpotifyApi.DeviceSpecificParameterObject) {
    return new Promise<void>(resolve => {
      if (fading.fadedown && !fading.fadeup) {
        const p = fading.volume
        if (p) {
          console.info('[Fade] Starting to fade up from 0 ->', p)
          for (let i = 1; i < 9; i++) {
            setTimeout(() => player.setVolume(Math.round(p * (i / 10) + 0.1), options), (i - 1) * 300)
          }
          setTimeout(() => {
            // 0.1 = 0 / 10 + c
            resolve(
              player.setVolume(p, options).finally(() => {
                fading.fadeup = false
                fading.fadedown = false
              })
            )
          }, 300 * 9)

          fading.fadeup = true
        } else {
          resolve()
        }
      } else {
        resolve()
      }
    })
  }

  async function startFadeDown (currentVolume?: number, options?: SpotifyApi.DeviceSpecificParameterObject) {
    return new Promise<void>(resolve => {
      if (!fading.fadedown) {
        const p = (fading.volume = currentVolume)
        if (p) {
          console.info('[Fade] Starting to fade down from', p, '->', 0)
          for (let i = 1; i < 9; i++) {
            setTimeout(() => player.setVolume(Math.round(p * (1 - i / 10)), options), (i - 1) * 300)
          }
          setTimeout(() => resolve(player.setVolume(0, options)), 300 * 9)

          fading.fadedown = true
        } else {
          return resolve()
        }
      } else {
        return resolve()
      }
    })
  }

  return { startFadeDown, startFadeUp, fading }
}
