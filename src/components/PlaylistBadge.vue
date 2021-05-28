<template>
  <div class="playlist-badge user-select-none" @click="open()" router-tag="div" target="_blank">
    <div class="img">
      <b-img :src="cover" fluid />
    </div>
    <div class="text">
      <div class="name" v-text="context.name" />
      <div class="owner" v-text="' av ' + context.owner.display_name" />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from '@vue/composition-api'

import { minBy } from 'lodash'

export default defineComponent({
  name: 'PlaylistBadge',
  props: {
    context: {
      type: Object as PropType<SpotifyApi.PlaylistObjectSimplified>,
      required: true,
    },
  },
  setup(props) {
    return {
      cover: computed(() => minBy(props.context.images, i => i.height)?.url),
      open: () => {
        Object.assign(document.createElement('a'), {
          target: '_blank',
          href: props.context.external_urls.spotify,
        }).click()
      },
    }
  },
})
</script>

<style scoped lang="scss">
.playlist-badge {
  background: #28292d;
  border: rgba(255, 255, 255, 0.452) 2px solid;
  border-radius: 6px;

  display: inline-flex;
  justify-content: stretch;

  transition: all 300ms;

  transform: scale(1);
  box-shadow: 0 0.2rem 0.2rem rgba(255, 255, 255, 0.075) !important;

  &:hover {
    cursor: pointer;
    transform: scale(1.05);
    box-shadow: 0 0.6rem 2rem rgba(255, 255, 255, 0.175) !important;
  }

  &:active {
    transform: scale(1.02);
    box-shadow: 0 0.6rem 2rem rgba(255, 255, 255, 0.175) !important;
    background: #484a4e;
  }

  .img {
    display: inline-flex;
    justify-content: center;
    height: 64px;
    img {
      border-top-left-radius: 6px;
      border-bottom-left-radius: 6px;
    }
  }

  .text {
    display: inline-flex;
    flex-direction: column;
    justify-content: center;

    margin-left: 0.4em;
    margin-right: 0.4em;
    .owner {
      text-align: left;
    }
  }
}
</style>
