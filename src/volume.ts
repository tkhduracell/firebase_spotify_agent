import { reactive, unref } from '@vue/composition-api'
import { MaybeRef } from '@vueuse/core'
import { concat, fill, range, zip } from 'lodash'

import { SpotifyPlayerProxy } from './player-proxy'
import { sleep } from './sleep'

export function useVolume (player: SpotifyPlayerProxy) {
  const fading = reactive({
    fadedown: false,
    fadeup: false
  })

  async function startFadeUp (targetVolume: number, duration_ms: number, device?: MaybeRef<{ device_id: string } | undefined>) {
    if (!targetVolume) return console.warn('No target volume!?')
    if (fading.fadedown || fading.fadeup) return console.log('Already fadeing..', fading)
    fading.fadeup = true

    const steps = player.isFast() ? 12 : 6
    const delayRange = fill(Array(steps), (duration_ms / steps) - 100) // Default network delay
    const volumeRange = concat(range(targetVolume / steps, targetVolume, targetVolume / steps), targetVolume).reverse()
    for (const [delay, volume] of zip(delayRange, volumeRange).reverse()) {
      await sleep(delay ?? 0)
      await player.setVolume(volume ?? 0, unref(device))
    }
    fading.fadeup = false
  }

  async function startFadeDown (currentVolume: number, duration_ms: number, device?: MaybeRef<{ device_id: string } | undefined>) {
    if (!currentVolume) return console.warn('No volume!?')
    if (fading.fadedown || fading.fadeup) return console.log('Already fadeing..', fading)
    fading.fadedown = true

    const steps = player.isFast() ? 12 : 6
    const delayRange = fill(Array(steps), (duration_ms / steps) - 100) // Default network delay
    const volumeRange = range(0, currentVolume, currentVolume / steps).reverse()
    for (const [delay, volume] of zip(delayRange, volumeRange)) {
      await sleep(delay ?? 0)
      await player.setVolume(volume ?? 0, unref(device))
    }
    fading.fadedown = false
  }

  return { startFadeDown, startFadeUp, fading }
}
