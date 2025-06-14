<template>
  <div :class="['climb', disabled ? 'disabled' : '']">
    <b-row class="no-gutters" align-v="center">
      <b-col cols="auto">
        <b-form-checkbox
          :checked="enabled"
          :disabled="disabled"
          @change="$emit('update:enabled', $event)"
          :class="['check-button', disabled ? 'disabled' : '']"
          switch
          size="lg"
        />
      </b-col>
      <b-col class="label main mr-2" cols="auto">
        Auto climb
        <span class="icon" v-b-tooltip.hover="'Automatically move between min and max as the target tempo'">
          <b-icon-question-circle-fill />
        </span>
      </b-col>
      <b-col class="mr-2"
        ><b-form-spinbutton
          :disabled="!enabled || disabled"
          class="custom"
          min="60"
          :max="max - step"
          step="5"
          size="lg"
          :value="min"
          @change="$emit('update:min', parseInt($event))"
        />
      </b-col>
      <b-col class="help mr-2" cols="auto">min</b-col>
      <b-col class="mr-2"
        ><b-form-spinbutton
          :disabled="!enabled || disabled"
          class="custom"
          :min="min + step"
          max="280"
          step="5"
          size="lg"
          :value="max"
          @change="$emit('update:max', parseInt($event))"
        />
      </b-col>
      <b-col class="help mr-2" cols="auto">max</b-col>
      <b-col class="mr-2"
        ><b-form-spinbutton
          :disabled="!enabled || disabled"
          class="custom"
          min="0"
          max="20"
          step="2"
          size="lg"
          :value="step"
          @change="$emit('update:step', parseInt($event))"
        />
      </b-col>
      <b-col class="label last" cols="auto">step </b-col>
    </b-row>
    <b-row align-content="end">
      <b-col class="label main"></b-col>
      <b-col class="pl-0" v-if="minutes">One cycle takes {{ minutes }} minutes over {{ tracks }} tracks.</b-col>
      <b-col class="pl-0" v-else>One cycle over {{ tracks }} tracks.</b-col>
    </b-row>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api'

export default defineComponent({
  name: 'PlaybackAutoIncrease',
  props: {
    enabled: { type: Boolean, required: true },
    disabled: { type: Boolean, required: true },
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    step: { type: Number, required: true },
    limit: { type: Number, required: false }
  },
  setup (props) {
    const tracks = computed(() => {
      const mod = (props.max - props.min) % props.step
      return mod === 0 ? (props.max - props.min) / props.step + 1 : Math.ceil((props.max - props.min) / props.step)
    })

    return {
      tracks,
      minutes: computed(() => {
        if (props.limit) {
          const exact = (tracks.value * props.limit) / 60
          return Math.round(exact)
        }
        return null
      })
    }
  }
})
</script>

<style lang="scss">
.climb {
  .label {
    font-weight: bold;
    margin-top: 6px;
  }
  .help {
    font-weight: bold;
    /* hide the label when screen width is below 1060px */
    @media (max-width: 1060px) {
      display: none;
    }
  }
  .label.main {
    max-width: 14em;
    min-width: 10em;
  }
  .label.last {
    width: 2em;
  }
  .check-button {
    &.disabled {
      opacity: 0.6;
    }
  }
  .beta {
    color: red;
    font-size: 70%;
    margin-left: 2px;
  }
  .icon {
    margin-left: 4px;
    color: #1b5894;
  }

  &.disabled {
    opacity: 0.5;
  }
}
</style>
