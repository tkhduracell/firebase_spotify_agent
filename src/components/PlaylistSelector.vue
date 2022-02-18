<template>
  <div class="playlist-list w-100 pt-2">
    <!--  -->

    <div class="task">
      <div class="abstract">
        <PlaylistBadge :title="name" :owner="context.owner.display_name || ''" :img="cover" />
      </div>
      <div class="details">
        <div class="details__inner pb-2">
          <div class="spacer">&nbsp;</div>
          <b-overlay :show="pending === pl.id" rounded="sm" variant="transparent" v-for="pl in others" :key="pl.id">
            <PlaylistBadge
                :title="pl.name"
                :owner="pl.owner"
                :img="pl.image"
                :header="''"
                class="mt-1 mr-1"
                @click="play(pl)"
              />
          </b-overlay>
          <div class="spacer" v-if="own.length > 0">&nbsp;</div>
          <b-overlay :show="pending === pl.id" rounded="lg" variant="transparent" v-for="pl in own" :key="pl.id">
            <PlaylistBadge
                :title="pl.name"
                :owner="pl.owner"
                :img="pl.image"
                :header="''"
                class="mt-1 mr-1"
                @click="play(pl)"
              />
          </b-overlay>
          <div class="spacer" v-if="own.length === 0">&nbsp;</div>
          <b-button variant="primary" @click="getOwn" v-if="own.length === 0">Get your playlists</b-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from '@vue/composition-api'

import { minBy, sortBy } from 'lodash'
import PlaylistBadge from '@/components/PlaylistBadge.vue'
import { createPlaylistInfo, PlaylistInfo } from '@/playlists'
import { SpotifyApi } from '@/types'
import { useSpotifyClient } from '@/auth'

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
  setup (props, { emit }) {
    const { client } = useSpotifyClient()
    const own = ref<PlaylistInfo[]>([])
    const pending = ref()

    watch(() => props.context.id, (id) => {
      if (id === pending.value) pending.value = undefined
    })

    return {
      cover: computed(() => minBy(props.context.images, i => i.height)?.url ?? ''),
      name: computed(() => props.context.name.replace(/ MASTER \(v\d+\)/gi, '')),
      others: computed(() => props.items.filter(p => p.id !== props.context.id)),
      getOwn: async () => {
        const { items } = await client.getUserPlaylists({ limit: 50 } as unknown as string)
        sortBy(items, i => i.name)
        own.value = items.map(p => createPlaylistInfo(p))
          .filter(p => !props.items.map(i => i.id).includes(p.id))
      },
      play: async (playlist: PlaylistInfo) => {
        pending.value = playlist.id
        emit('play', playlist.uri)
        setTimeout(() => {
          pending.value = undefined
        }, 3000)
      },
      own,
      pending
    }
  }
})
</script>

<style scoped lang="scss">
$bg: rgba(#252525, 1);
$primary: rgba(#2bab66, 1);

.playlist-list {
  background: $bg;
  position: relative;
}
.task {
  position: relative;

  height: 64px;
  z-index: 1000;

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
    color: $primary;
  }
}

.spacer {
  width: calc(100% - 4em);
  height: 2px;
  border-radius: 10px;
  background: rgba($primary, 0.4);
  margin-right: calc(2em - 4px);
  margin-top: 0.6em;
  margin-bottom: 0.6em;
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
  align-items: flex-end;
  max-height: 50vh;
  overflow-y: scroll;
  overflow-x: hidden;

  scrollbar-color: $primary $bg;

  &::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: $primary;
  }
  &::-webkit-scrollbar-track {
    background: $bg;
  }

}

</style>
