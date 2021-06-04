<template>
  <b-overlay :show="queue.loading" variant="dark">
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
    queue: { type: Object as PropType<QueueState>, requied: true },
  },
})
</script>

<style></style>
