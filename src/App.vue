<template>
  <div id="app">
    <b-navbar toggleable="lg" type="dark" variant="info" id="nav">
      <b-navbar-brand to="/">
        <img src="favicon2.svg" class="d-inline-block align-top mr-2" alt="SA logo" height="30em" width="30em" />
        Spotify Agent
      </b-navbar-brand>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item active-class="active" exact :to="{ name: 'Home', hash: $route.hash }">Home</b-nav-item>
          <b-nav-item-dropdown text="Tools" right>
            <b-dropdown-item active-class="active" :to="{ name: 'Recommendations' }">Song finder</b-dropdown-item>
            <b-dropdown-item active-class="active" :to="{ name: 'PlaylistInspect' }">Playlist Inspector</b-dropdown-item>
            <b-dropdown-item active-class="active" :to="{ name: 'PlaylistCreate' }">Playlist Creator</b-dropdown-item>
          </b-nav-item-dropdown>
          <b-nav-item active-class="active" :to="{ name: 'About' }">About</b-nav-item>
        </b-navbar-nav>

        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">
          <b-nav-item href="/status">{{ spotifyState.name }}</b-nav-item>
          <b-nav-item href="/logout">Logout</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
    <router-view class="mt-4" />
    <footer>
      <b-link v-b-modal="'signin'" v-if="!userState.id" class="ml-1">
        <b-icon-lock-fill />
      </b-link>
      Version
      <a
        class="text-monospace"
        v-text="env.BUILD_GIT_COMMIT_HASH"
        href="https://github.com/tkhduracell/firebase_spotify_agent/commits/main"
      />
      - <span class="text-monospace" v-text="env.BUILD_TIME" />
      -
      <div class="d-inline-block d-sm-none">XS</div>
      <div class="d-none d-sm-inline-block d-md-none">SM</div>
      <div class="d-none d-md-inline-block d-lg-none">MD</div>
      <div class="d-none d-lg-inline-block d-xl-none">LG</div>
      <div class="d-none d-xl-inline-block">XL</div>
      <div class="d-inline-block ml-1" v-if="isWakeLockActive">- Wakelock</div>
    </footer>
    <LoginDialog />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted } from '@vue/composition-api'
import { useSpotifyAuth } from './auth'
import { useWakeLock } from '@vueuse/core'
import { useUserState, useSpotifyState } from './state'
import { usePlayerReady } from './player'
import LoginDialog from './components/LoginDialog.vue'

export default defineComponent({
  name: 'App',
  metaInfo: {
    title: 'Spotify Agent',
    link: [{ rel: 'icon favicon', type: 'image/svg', href: 'favicon.svg' }]
  },
  setup (props, { root: { $el, $router } }) {
    const { BUILD_GIT_COMMIT_HASH, NODE_ENV, BUILD_TIME } = process.env
    useSpotifyAuth($router.currentRoute, true)

    const spotifyState = useSpotifyState()
    const userState = useUserState()

    usePlayerReady($el)

    const { isSupported, request, release, isActive: isWakeLockActive } = useWakeLock()
    if (isSupported) {
      onMounted(() => {
        if (isSupported) {
          try {
            request('screen')
          } catch (e) {
            console.debug('Unable to aquire wakelock')
          }
        }
      })
      onUnmounted(() => release())
    }

    return {
      env: { BUILD_GIT_COMMIT_HASH, NODE_ENV, BUILD_TIME },
      userState,
      spotifyState,
      isWakeLockActive
    }
  },
  components: { LoginDialog }
})
</script>
<style lang="scss" scoped>
footer {
  text-align: right;
  position: absolute;
  top: 6em;
  width: 100%;
  font-size: 0.6em;
  padding-right: 10px;
}
</style>
