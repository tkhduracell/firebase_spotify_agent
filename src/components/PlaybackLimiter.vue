<template>
  <div class="limiter-control">
    <b-row>
      <b-col class="label">Skip to next after (seconds)</b-col>
      <b-col
        ><b-form-input
          type="number"
          class="custom"
          :value="value + ''"
          @update="$emit('update:value', parseInt($event))"
        />
      </b-col>
      <div class="w-100 mt-3"></div>
      <b-col v-for="sec in fixed" :key="'set-' + sec">
        <b-button
          class="fixed w-100"
          variant="primary"
          @click="$emit('update:value', sec)"
          v-text="sec + ' sec'"
        />
      </b-col>
    </b-row>

    <div></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

export default defineComponent({
  name: 'PlaybackLimiter',
  props: {
    value: { type: Number, required: true },
  },
  setup() {
    return {
      fixed: [30, 60, 90, 120],
    }
  },
})
</script>

<style lang="scss">
.limiter-control {
  .label {
    font-weight: bold;
    margin-top: 6px;
  }
}
</style>
