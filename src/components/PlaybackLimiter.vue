<template>
  <div class="limiter-control">
    <b-row class="no-gutters" align-v="center">
      <b-col cols="auto">
        <b-form-checkbox :checked="enabled" @change="$emit('update:enabled', $event)" class="check-button" switch size="lg" />
      </b-col>
      <b-col class="label main mr-2" cols="auto">Skip to next after</b-col>
      <b-col
        v-for="sec in fixed"
        :key="'set-' + sec"
        cols="auto"
        v-b-tooltip="{
          title: 'Have already passed this. Please wait for the next song...',
          placement: 'top',
          disabled: !enabled || !(enabled && progress + 10 > sec),
        }"
      >
        <b-button
          :disabled="!enabled || progress + 10 > sec"
          :class="['fixed', 'mr-1', [30, 150].includes(sec) ? 'hide-large' : '']"
          size="lg"
          variant="primary"
          @click="$emit('update:value', sec)"
          v-text="sec"
        />
      </b-col>
      <b-col class="mr-2 hide-on-small">
        <b-form-spinbutton
          :disabled="!enabled"
          size="lg"
          :step="5"
          :min="Math.max(10.0 * Math.ceil(progress / 10.0) + 10, 20)"
          :max="86400"
          :value="value"
          @change="$emit('update:value', Math.max(10.0 * Math.ceil(progress / 10.0) + 10, parseInt($event)))"
        />
      </b-col>
      <b-col class="label last" cols="auto">sec</b-col>
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
    progress: { type: Number, required: true },
    enabled: { type: Boolean, required: true }
  },
  setup () {
    return {
      fixed: [30, 60, 90, 120, 150, 200]
    }
  }
})
</script>

<style lang="scss">
.limiter-control {
  .label {
    font-weight: bold;
    margin-top: 6px;
  }
  .label.main {
    max-width: 14em;
    min-width: 10em;
  }
  .label.last {
    width: 2em;
  }
  @media (max-width: 1400px) {
    .hide-large {
      display: none;
    }
  }
  .hide-on-small {
    @media (max-width: 560px) {
      display: none;
    }
  }
}
</style>
