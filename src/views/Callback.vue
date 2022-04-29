<template>
  <div class="fullscreen-state">
    <div v-if="me">
      <div>
        <b-img v-if="me.images" :src="me.images[0].url" rounded="circle" class="thumb" />
      </div>
      <div class="mt-4 text">
        Success! Welcome {{ me.display_name }}!
      </div>
    </div>
    <div v-else-if="error">
      <h2>Login failed</h2>
      <p>Error: {{error}}</p>
      <b-button :to="{ name: 'Login' }">
        Try again
      </b-button>
    </div>
    <div v-else>
      <b-spinner type="grow" variant="primary" class="spinner-grow-large" />
    </div>
  </div>
</template>
<script lang="ts">
import { SpotifyToken, SpotifyTokenResponse } from '@/auth'
import { useSpotifyState } from '@/state'
import { SpotifyApi } from '@/types'
import { computed, defineComponent, onMounted, ref, watch } from '@vue/composition-api'

export default defineComponent({
  setup (props, { root: { $route, $router } }) {
    const state = useSpotifyState()
    const me = ref<SpotifyApi.UserProfileResponse>()
    const error = computed(() => $route.query.error)
    onMounted(async () => {
      if (error.value) return
      const p = $route.query as unknown as SpotifyTokenResponse
      state.token = new SpotifyToken(p)

      const client = new SpotifyApi()
      client.setAccessToken(state.token.access_token)

      me.value = await client.getMe()

      setTimeout(() => {
        $router.push({ name: 'Start' })
      }, 1000)
    })
    return { me, error }
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

  .thumb, .spinner-grow.spinner-grow-large {
    width: 10em;
    height: 10em;
  }
}
</style>
