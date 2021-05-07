import { reactive, Ref } from '@vue/composition-api'

import SpotifyWebApi from 'spotify-web-api-js'

export function useVolume(client: SpotifyWebApi.SpotifyWebApiJs) {
  const fading = reactive({
    fadedown: false,
    fadeup: false,
    volume: 0 as number | null | undefined,
  })

  async function startFadeUp() {
    return new Promise<void>(resolve => {
      if (fading.fadedown && !fading.fadeup) {
        const p = fading.volume
        if (p) {
          console.log('[Fade] Starting to fade up from 0 ->', p)
          setTimeout(() => client.setVolume(Math.round(p * 0.1)), 0)
          setTimeout(() => client.setVolume(Math.round(p * 0.2)), 500)
          setTimeout(() => client.setVolume(Math.round(p * 0.3)), 1000)
          setTimeout(() => client.setVolume(Math.round(p * 0.4)), 1500)
          setTimeout(() => client.setVolume(Math.round(p * 0.5)), 2000)
          setTimeout(() => client.setVolume(Math.round(p * 0.6)), 2500)
          setTimeout(() => client.setVolume(Math.round(p * 0.7)), 3500)
          setTimeout(() => client.setVolume(Math.round(p * 0.8)), 4000)
          setTimeout(() => client.setVolume(Math.round(p * 0.9)), 4500)
          setTimeout(() => {
            resolve(
              client.setVolume(p).finally(() => {
                fading.fadeup = false
                fading.fadedown = false
              })
            )
          }, 5000)

          fading.fadeup = true
        } else {
          resolve()
        }
      } else {
        resolve()
      }
    })
  }

  async function startFadeDown(currentVolume?: number) {
    return new Promise<void>(resolve => {
      if (!fading.fadedown) {
        const p = (fading.volume = currentVolume)
        if (p) {
          console.log('[Fade] Starting to fade down from', p, '->', 0)
          setTimeout(() => client.setVolume(Math.round(p * 0.9)), 0)
          setTimeout(() => client.setVolume(Math.round(p * 0.8)), 500)
          setTimeout(() => client.setVolume(Math.round(p * 0.7)), 1000)
          setTimeout(() => client.setVolume(Math.round(p * 0.6)), 1500)
          setTimeout(() => client.setVolume(Math.round(p * 0.5)), 2000)
          setTimeout(() => client.setVolume(Math.round(p * 0.4)), 2500)
          setTimeout(() => client.setVolume(Math.round(p * 0.3)), 3500)
          setTimeout(() => client.setVolume(Math.round(p * 0.2)), 4000)
          setTimeout(() => client.setVolume(Math.round(p * 0.1)), 4500)
          setTimeout(() => resolve(client.setVolume(0)), 5000)

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
