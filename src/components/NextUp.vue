<template>
  <b-overlay :show="!!queue.loading" variant="dark">
    <template #overlay>
      <div class="d-flex align-items-center">
        <div><b-spinner variant="primary" /></div>
        <span class="ml-3" v-if="typeof queue.loading === 'string'" v-text="queue.loading" />
      </div>
    </template>

    <b class="d-block"> Next up {{ queue.sent ? ' - Queued!' : '' }}</b>
    <div class="artist" v-text="queue.track && queue.track.artist" />
    <div class="title" v-text="queue.track && queue.track.title" />
    <div class="tempo" v-text="queue.track && queue.track.bpm.toFixed(0)" />
    <p :class="{ small: true, 'text-danger': queue.pool < 10 }">selected among {{ queue.pool }} other track</p>
  </b-overlay>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api'
import { QueueState } from '@/types'

export default defineComponent({
  props: {
    queue: { type: Object as PropType<QueueState>, required: true }
  }
})
</script>

<style></style>
