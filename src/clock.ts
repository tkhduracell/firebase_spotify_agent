import { computed, onMounted, onUnmounted, ref } from '@vue/composition-api'

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

  const hhmm = computed(() => {
    const h = clock.value.getHours()
    const hh = h < 10 ? `0${h}` : h
    const m = clock.value.getMinutes()
    const mm = m < 10 ? `0${m}` : m
    return hh + ':' + mm
  })
  return { clock, hhmm }
}
