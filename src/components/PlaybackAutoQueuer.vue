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
      <b-col class="label main mr-2" cols="auto">Auto queue</b-col>
      <b-col class="mr-2"
        ><b-form-spinbutton
          :disabled="!enabled"
          class="custom"
          min="80"
          max="200"
          step="10"
          size="lg"
          :value="target"
          @change="$emit('update:target', parseInt($event))"
        />
      </b-col>
      <b-col class="label mr-2" cols="auto"
        >bpm
        <b-icon-alt scale="1.4" class="ml-1 mr-1" />
      </b-col>
      <b-col class="mr-2"
        ><b-form-spinbutton
          :disabled="!enabled"
          class="custom"
          min="0"
          max="20"
          step="5"
          size="lg"
          :value="range"
          @change="$emit('update:range', parseInt($event))"
        />
      </b-col>
      <b-col class="label mr-2" cols="auto">bpm </b-col>
    </b-row>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

export default defineComponent({
  name: 'PlaybackAutoQueuer',
  props: {
    enabled: { type: Boolean, required: true },
    target: { type: Number, required: true },
    range: { type: Number, required: true },
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
  .check-button {
    margin-top: 0.2em;
  }
}
</style>
