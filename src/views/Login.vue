<template>
  <div class="fullscreen-state">
    <div class="">
      <b-spinner type="grow" variant="primary" class="spinner-grow-large" />
    </div>
    <div class="mt-4 text">
      Redirecting to Spotify's login page
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, onMounted } from '@vue/composition-api'

export default defineComponent({
  setup () {
    const { VUE_APP_AUTH_SERVER_URL: auth_url } = process.env
    const suffix = '/login?page=player'
    onMounted(() => {
      document.location = (auth_url + suffix) as unknown as Location
    })
    return {}
  }
})
</script>

<style lang="scss">
.fullscreen-state {
  display: flex;
  height: 100vh;
  width:  100vw;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  .text {
    font-size: 1.4rem;
  }
  .spinner-grow.spinner-grow-large {
    width: 10em;
    height: 10em;
  }
}
</style>
