<template>
      <b-modal
      scrollable
    id="select-track"
    title="Select song from playlist"
    ok-only
    ok-variant="secondary"
    ok-title="Cancel"
    size="lg"
    header-bg-variant="dark"
      header-text-variant="light"
      body-bg-variant="dark"
      body-text-variant="light"
      footer-bg-variant="dark"
      footer-text-variant="light"
  >
    <b-form-input type="search" id="input-search" v-model="query" autofocus placeholder="Search track..." class="mb-2"/>
    <div v-if="playlist" class="results">
        <div class="track" v-for="t in tracks" :key="'select-' + t.id" @click="playTrack(t)">
            <div class="inner w-100 p-2">
                <span class="icon mr-2">
                    <b-icon-play-fill scale="1.2" />
                </span>
                <span class="text" v-text="trackFormat(t)" />
                <span class="bpm" v-text="t.bpm.toFixed(0) + ' BPM'" />
            </div>
        </div>
    </div>
  </b-modal>
</template>

<script lang="ts">
import { TrackWithBPM, trackFormat } from '@/tracks'
import { computed, defineComponent, PropType, ref } from '@vue/composition-api'

export default defineComponent({
  props: {
    playlist: Array as PropType<TrackWithBPM[]>
  },
  setup (props, { emit, root: { $bvModal } }) {
    const query = ref('')
    return {
      query,
      trackFormat,
      tracks: computed(() => {
        const q = query.value.toLowerCase()
        return props.playlist?.filter((t) => {
          return t.artist.toLowerCase().includes(q) ||
                t.title.toLowerCase().includes(q)
        }).slice(0, 10) ?? []
      }),
      playTrack: (t: TrackWithBPM) => {
        $bvModal.hide('select-track')
        emit('play', t)
      }
    }
  }
})
</script>
<style lang="scss" scoped>
    $bg: rgba(#252525, 1);
    .results {
        background: $bg;
        .track {
            cursor: pointer;
            height: 2.8em;
            user-select: none;
            &:hover {
                background: lighten($bg, 10%);
                .inner .icon,.text {
                  svg {
                    // font-size: 1.1rem;
                    opacity: 1.0;
                  }
                }
            }
            &:active,&:active {
                background: lighten($bg, 20%);
                .inner .icon,.text {
                  svg {
                    // font-size: 1.2rem;
                    opacity: 1.0;
                  }
                }
            }
            .inner {
              display: flex;
              flex-direction: row;
              .bpm {
                margin-left: auto;
              }
              .icon {
                color: #2bab66;
                svg {
                  transition: all 0s cubic-bezier(0.645, 0.045, 0.355, 1);
                  opacity: 0.0;
                }
              }
            }
        }
    }
</style>
