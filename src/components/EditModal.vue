<template>
  <b-modal id="trackedit" :title="`Edit: ${track.title}`" @show="prepare" @ok="update">
    <b-form @submit.prevent="update" @keyup.space="count">
      <b-form-group label="Enter BPM" label-for="input-tempo">
        <b-form-input autofocus size="lg" id="input-tempo" type="number" step="1" number v-model="bpm" trim></b-form-input>
      </b-form-group>
      <div v-if="last > 0">Beats: {{ history.length }}, mean: {{ meanMs.toFixed(0) }} ms, bpm: {{ meanBPM }}</div>
    </b-form>
  </b-modal>
</template>

<script lang="ts">
import { TrackWithBPM } from '@/tracks'
import { defineComponent, ref, watch, PropType, computed } from '@vue/composition-api'
import { useRefHistory } from '@vueuse/core'
import { debounce, mean } from 'lodash'

export default defineComponent({
  props: {
    track: { type: Object as PropType<TrackWithBPM>, required: true },
  },
  setup(props, { emit, root: { $bvModal } }) {
    const bpm = ref<number>(0)
    async function prepare() {
      bpm.value = Math.floor(props.track.bpm)
    }

    const last = ref(0)
    const { history, clear } = useRefHistory(last, { capacity: 30 })
    const meanMs = computed(() => {
      if (history.value.length > 10) {
        const diffs = []
        for (let i = 1; i < history.value.length - 1; i++) {
          diffs.push(history.value[i - 1].timestamp - history.value[i].timestamp)
        }
        return mean(diffs.filter(ms => ms < 1200))
      }
      return 0
    })
    const meanBPM = computed(() => (meanMs.value === 0 ? 0 : Math.floor(60.0 / (meanMs.value / 1000))))

    watch(meanBPM, value => {
      if (value) {
        bpm.value = Math.floor(value)
      }
    })

    const onUpdate = debounce(() => {
      last.value = 0
      clear()
    }, 4000)

    async function count() {
      last.value = new Date().getTime()
      onUpdate()
    }

    async function update() {
      const { id } = props.track
      await $bvModal.hide('trackedit')
      emit('update:track', { id, bpm: bpm.value })
    }

    return {
      bpm,
      prepare,
      update,
      count,
      last,
      history,
      meanBPM,
      meanMs,
    }
  },
})
</script>

<style></style>
