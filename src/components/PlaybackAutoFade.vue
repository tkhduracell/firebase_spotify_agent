<template>
  <div class="queuer">
    <b-row class="no-gutters" align-v="center">
      <b-col cols="auto">
        <b-form-checkbox :checked="enabled" @change="$emit('update:enabled', $event)" class="check-button" switch size="lg" />
      </b-col>
      <b-col class="label main mr-2" cols="auto">Auto fade</b-col>
      <b-col class="mr-2 " cols="auto">
        <b-button
          size="small"
          class="d-inline"
          :disabled="isFading || volume <= 0"
          @click="$emit('update:volume', 0 - 10)"
        >
          <b-icon-dash />
        </b-button>
      </b-col>

      <b-col class=" mr-2 bar">
        <b-progress height="2.5rem" :max="100" v-if="volume !== null && volume !== undefined">
          <b-progress-bar
            variant="secondary"
            :animated="isFading"
            :value="volume"
            :label="volume > 15 ? 'Volume ' + volume + '' : ''"
          ></b-progress-bar>
        </b-progress>
      </b-col>
      <b-col class="mr-2 " cols="auto">
        <b-button
          size="small"
          class="d-inline"
          :disabled="isFading || volume >= 100"
          @click="$emit('update:volume', 10)"
        >
          <b-icon-plus />
        </b-button>
      </b-col>

      <b-col cols="auto" class="label last pl-1 pt-1">
        <b-icon-percent scale="1.3" />
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
    volume: { type: Number, required: true },
    isFading: { type: Boolean, required: false }
  }
})
</script>

<style lang="scss">
.queuer {
  .label {
    font-weight: bold;
  }
  .label.main {
    max-width: 14em;
    min-width: 10em;
  }
  .label.last {
    width: 2em;
  }
  .bar .progress-bar {
    font-weight: bold;
    font-size: 1.4rem;
  }
}
</style>
