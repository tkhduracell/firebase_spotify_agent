<template>
  <div class="queuer">
    <b-row class="no-gutters" align-v="center">
      <b-col cols="auto">
        <b-form-checkbox
          :checked="enabled"
          @change="$emit('update:enabled', $event)"
          class="check-button"
          switch
          size="lg"
        />
      </b-col>
      <b-col class="label main mr-2" cols="auto">Auto fade</b-col>
      <b-col class="mt-2 mr-2">
        <b-progress
          height="2.5rem"
          :max="100"
          v-if="volume !== null && volume !== undefined"
        >
          <b-progress-bar
            variant="secondary"
            :animated="isFading"
            :value="volume"
            :label="volume > 15 ? 'Volume: ' + volume + '%' : ''"
          ></b-progress-bar>
        </b-progress>
      </b-col>
      <b-col cols="auto" class="label last pl-1 pt-1" v-if="volume">
        <b-icon-speaker-fill scale="1.2" />
      </b-col>
    </b-row>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

export default defineComponent({
  name: 'PlaybackAutoFade',
  props: {
    enabled: { type: Boolean, required: true },
    volume: { type: Number, required: false },
    isFading: { type: Boolean, required: false },
  },
})
</script>

<style lang="scss">
.queuer {
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
  .check-button {
    margin-top: 0.2em;
  }
}
</style>
