<template>
  <div class="playlist-badge user-select-none" @click="$emit('click')" router-tag="div" target="_blank">
    <div class="img">
      <b-img :src="img" fluid />
    </div>
    <div class="text">
      <div class="header" v-text="header" />
      <div class="name" v-text="title" />
      <div class="owner" v-text="'av ' + owner" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

export default defineComponent({
  name: 'PlaylistBadge',
  props: {
    header: { type: String, required: false, default: () => 'Spelar från' },
    title: { type: String, required: true },
    owner: { type: String, required: true },
    img: { type: String, required: true }
  }
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
    max-height: 64px;
    max-width: 64px;
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
