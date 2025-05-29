<template>
  <div class="playlist-list w-100">
    <!--  -->

    <div class="task">
      <div class="abstract">
        <PlaylistBadge :title="context.name" :description="context.owner.display_name || ''" :img="cover" />
      </div>
      <div class="details">
        <div class="details__inner">
          <PlaylistBadge
            :title="pl.name"
            :description="pl.owner"
            :img="pl.image"
            :header="''"
            class="mt-1 mr-1"
            @click="$emit('play', pl.uri)"
            v-for="pl in others"
            :key="pl.id"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from '@vue/composition-api'

import { minBy } from 'lodash'
import PlaylistBadge from '@/components/PlaylistBadge.vue'
import { PlaylistInfo } from '@/presets'
import { SpotifyApi } from '@/auth'

export default defineComponent({
  components: { PlaylistBadge },
  name: 'PlaylistSelector',
  props: {
    context: {
      type: Object as PropType<SpotifyApi.PlaylistObjectSimplified>,
      required: true
    },
    items: {
      type: Array as PropType<PlaylistInfo[]>,
      required: false,
      default: () => []
    }
  },
  setup (props) {
    return {
      cover: computed(() => minBy(props.context.images, i => i.height)?.url ?? ''),
      others: computed(() => props.items.filter(p => p.id !== props.context.id))
    }
  }
})
</script>

<style scoped lang="scss">
$bg: rgba(#252525, 1);
.playlist-list {
  background: $bg;
  position: relative;
}
.task {
  position: relative;

  height: 64px;
  z-index: 1040;

  cursor: pointer;

  perspective: 800px;
  transform-style: preserve-3d;
}

.abstract,
.details {
  background: $bg;
  .task:hover & {
    background: rgba(darken($bg, 0%), 0.7);
  }
}

.abstract {
  transition: 0.3s ease all;
  display: flex;
  flex-direction: row-reverse;
  padding-right: 8px;
  .task:hover & {
    color: #2bab66;
  }
}

.details {
  max-height: 0;
  padding: 0;

  overflow: hidden;
  visibility: hidden;

  transform: rotateX(-180deg);
  transform-origin: top center;
  backface-visibility: hidden;
  transition: 0.3s transform ease;

  .task:hover & {
    position: relative;
    max-height: none;
    overflow: visible;
    visibility: visible;
    transform: rotateX(0deg);
  }
}

.details__inner {
  background: rgba(darken($bg, 0%), 0.7);
  display: flex;
  flex-direction: column;
  padding-right: 8px;
}
</style>
