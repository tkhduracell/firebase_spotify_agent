<template>
  <b-modal
    id="trackedit"
    :title="`Edit: ${track.title} (${track.id})`"
    @show="prepare"
    @ok="update($event, false)"
    ok-title="Save"
    @cancel="update($event, true)"
    cancel-title="Save &amp; Next"
    :cancel-disabled="loading"
    :ok-disabled="loading"
  >
    <b-form @submit.prevent="update">
      <b-form-group>
        <template v-slot:label>
          <label label-for="input-tempo">
            Enter BPM
            <span v-if="track.bpm"> (<b-link @click.prevent="double">x2</b-link>) </span>
          </label>
        </template>

        <b-form-input
          size="lg"
          id="input-tempo"
          type="number"
          :min="50"
          :max="300"
          :step="1"
          v-model="bpm"
          number
          autofocus
          @keydown.space="count"
        />
      </b-form-group>
      <div v-if="last > 0">Beats: {{ history.length - 1 }}, mean: {{ meanMs.toFixed(0) }} ms, bpm: {{ meanBPM }}</div>
    </b-form>
  </b-modal>
</template>

<script lang="ts">
import { TrackWithBPM } from '@/tracks'
import { defineComponent, ref, watch, PropType, computed } from '@vue/composition-api'
import { useRefHistory } from '@vueuse/core'
import { debounce, mean } from 'lodash'
import { BvModalEvent } from 'bootstrap-vue'
import { sleep } from '@/sleep'

export default defineComponent({
  props: {
    track: { type: Object as PropType<TrackWithBPM>, required: true },
  },
  setup(props, { emit }) {
    const bpm = ref<number>(0)
    const loading = ref<boolean>(false)

    async function prepare() {
      bpm.value = Math.round(props.track.bpm)
    }

    const last = ref(0)
    const { history, clear } = useRefHistory(last, { capacity: 20 })

    const meanMs = computed(() => {
      if (history.value.length > 10) {
        const diffs = []
        for (let i = 1; i < history.value.length - 1; i++) {
          diffs.push(history.value[i - 1].timestamp - history.value[i].timestamp)
        }
        return mean(diffs.filter(ms => ms > 0 && ms < 1200))
      }
      return 0
    })
    const meanBPM = computed(() => (meanMs.value === 0 ? 0.0 : Math.floor(60.0 / (meanMs.value / 1000.0))))

    watch(meanBPM, value => {
      if (value) {
        bpm.value = Math.round(value)
      }
    })

    const onUpdate = debounce(() => {
      last.value = 0
      clear()
    }, 4000)

    async function count(evt: KeyboardEvent) {
      evt.preventDefault()
      last.value = new Date().getTime()
      onUpdate()
    }

    async function update(bvModalEvent: BvModalEvent, next = false) {
      const { id, bpm: originalBpm } = props.track

      if (Math.round(originalBpm) !== Math.round(bpm.value)) {
        emit('update:track', { id, bpm: Math.round(bpm.value) })
      }

      if (next) {
        emit('skip:track')
        loading.value = true
        bvModalEvent.preventDefault()
        setTimeout(async () => {
          for (let i = 0; i < 10; i++) {
            if (id !== props.track.id) {
              loading.value = false
              prepare()
              return
            }
            await sleep(500)
          }
          loading.value = false
        }, 2000)
      }
    }

    function double() {
      bpm.value = Math.round((props.track.bpm ?? bpm.value) * 2)
    }

    return {
      bpm,
      prepare,
      update,
      count,
      double,
      last,
      history,
      meanBPM,
      meanMs,
      loading,
    }
  },
})
</script>

<style></style>
