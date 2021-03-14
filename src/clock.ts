import { onMounted, onUnmounted, ref } from '@vue/composition-api'

export function useClock() {
  const handle = ref<number>()
  const clock = ref(new Date())
  onMounted(() => {
    handle.value = setInterval(() => {
      clock.value = new Date()
    }, 5)
  })
  onUnmounted(() => {
    if (handle.value) {
      clearInterval(handle.value)
    }
  })
  return { clock }
}
