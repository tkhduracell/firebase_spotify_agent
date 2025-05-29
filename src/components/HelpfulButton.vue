<template>
  <div
    v-b-tooltip="{
      title: help,
      placement: 'top',
      disabled: !disabled,
    }"
  >
    <b-button variant="link" @click="$emit('click')" :disabled="disabled">
      <slot />
    </b-button>
  </div>
</template>
<script>
import { defineComponent } from '@vue/composition-api'

export default defineComponent({
  props: {
    disabled: { type: Boolean, default: () => false },
    help: { type: String, default: () => 'Next song is about to play' }
  }
})
</script>
