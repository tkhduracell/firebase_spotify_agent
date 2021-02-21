<template>
  <div class="limiter-control">
    <b-row class="no-gutters">
      <b-col class="label mr-2" cols="auto">Skip to next after</b-col>
      <b-col class="mr-2"
        ><b-form-input
          type="number"
          class="custom"
          :value="value + ''"
          @update="$emit('update:value', parseInt($event))"
        />
      </b-col>
      <b-col class="label mr-2" cols="auto">sec</b-col>
      <b-col v-for="sec in fixed" :key="'set-' + sec" cols="auto">
        <b-button
          class="fixed ml-1"
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
