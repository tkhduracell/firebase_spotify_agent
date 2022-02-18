<template>
    <b-icon-speaker scale="1.6" v-if="type === 'Speaker'" />
    <b-icon-speaker scale="1.6" v-else-if="type === 'CastAudio'" />
    <b-icon-laptop scale="1.6" v-else-if="type === 'Computer'" />
    <b-icon-tv scale="1.6" v-else-if="type === 'Chromecast'" />
    <b-icon-phone scale="1.6" v-else-if="type === 'Smartphone'" />
    <b-icon-box scale="1.6" v-else />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

export default defineComponent({
  props: {
    type: { type: String, required: true }
  },
  setup () {
    return {}
  }
})
</script>
