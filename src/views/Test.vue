<template>
    <SelectSongModal :playlist="playlist" />
</template>
<script lang="ts">
import { defineComponent } from '@vue/composition-api'

import SelectSongModal from '@/components/SelectSongModal.vue'
import { TrackWithBPM } from '@/tracks'

export default defineComponent({
  components: { SelectSongModal },
  setup () {
    return {
      playlist: [
        { id: '1', title: 'track 1', artist: 'a1', bpm: 123.34 },
        { id: '2', title: 'track 2', artist: 'a2', bpm: 123.34 },
        { id: '3', title: 'track 3', artist: 'a3', bpm: 123.34 },
        { id: '4', title: 'track 4', artist: 'a4', bpm: 123.34 }
      ] as TrackWithBPM[]
    }
  }
})
</script>
