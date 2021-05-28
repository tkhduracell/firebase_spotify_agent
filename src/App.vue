<template>
  <div id="app">
    <b-navbar toggleable="lg" type="dark" variant="info" id="nav">
      <b-navbar-brand to="/">
        <img src="favicon.svg" class="d-inline-block align-top mr-2" alt="SA logo" height="30em" width="30em" />
        Spotify Agent
      </b-navbar-brand>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item active-class="active" exact :to="{ name: 'Home', hash: $route.hash }">Home</b-nav-item>
          <b-nav-item active-class="active" :to="{ name: 'Recommendations' }">Song finder</b-nav-item>
          <b-nav-item active-class="active" :to="{ name: 'About' }">About</b-nav-item>
        </b-navbar-nav>

        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">
          <b-nav-item href="/status">My Profile</b-nav-item>
          <b-nav-item href="/logout">Logout</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
    <router-view class="mt-4" />
    <footer>
      Version <span class="text-monospace" v-text="env.BUILD_GIT_COMMIT_HASH" /> - <span class="text-monospace" v-text="env.BUILD_TIME" />
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

export default defineComponent({
  name: 'App',
  metaInfo: {
    title: 'Spotify Agent',
    link: [{ rel: 'icon favicon', type: 'image/svg', href: 'favicon.svg' }],
  },
  setup() {
    const { BUILD_GIT_COMMIT_HASH, NODE_ENV, BUILD_TIME } = process.env
    return {
      env: { BUILD_GIT_COMMIT_HASH, NODE_ENV, BUILD_TIME },
    }
  },
})
</script>
<style lang="scss" scoped>
footer {
  text-align: right;
  position: absolute;
  bottom: 0;
  width: 100%;
  font-size: 0.6em;
  padding-right: 10px;
}
</style>
