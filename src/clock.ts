import { computed, onMounted, onUnmounted, ref } from '@vue/composition-api'
import { useInterval } from 'vue-composable'

export function useClock() {
  const clock = ref(new Date())

  const { start, remove } = useInterval(() => (clock.value = new Date()), 1000)

  onMounted(start)
  onUnmounted(remove)

  const hhmm = computed(() => {
    const h = clock.value.getHours()
    const hh = h < 10 ? `0${h}` : h
    const m = clock.value.getMinutes()
    const mm = m < 10 ? `0${m}` : m
    return hh + ':' + mm
  })
  return { clock, hhmm }
}
