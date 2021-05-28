<template>
  <div class="playlist-badge user-select-none" @click="open()" router-tag="div" target="_blank">
    <div class="img">
      <b-img :src="cover" fluid />
    </div>
    <div class="text">
      <div class="header">Spelar från</div>
      <div class="name" v-text="context.name" />
      <div class="owner" v-text="context.owner.display_name" />
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
  display: inline-flex;
  flex-direction: row-reverse;
  height: 64px;

  transition: all 300ms;

  transform: scale(1);
  margin-right: 0px;

  &:hover {
    cursor: pointer;
    transform: scale(1.05);
    margin-right: 6px;
  }

  &:active {
    transform: scale(1.02);
  }

  .img {
    height: 100%;
    img {
      border-top-left-radius: 6px;
      border-bottom-left-radius: 6px;
    }
  }

  .text {
    font-size: 1.2rem;
    margin-left: 10px;
    margin-right: 10px;
    align-self: center;

    .header {
      font-size: 0.7rem;
      text-align: right;
      color: #d0d0d0;
    }
    .owner {
      text-align: right;
      font-size: 1rem;
      color: #d0d0d0;
    }
  }
}
</style>
