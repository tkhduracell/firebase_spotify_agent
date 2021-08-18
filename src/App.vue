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
          <b-nav-item href="/status">{{ spotifyUser.name }}</b-nav-item>
          <b-nav-item href="/logout">Logout</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
    <router-view class="mt-4" />
    <footer>
      <b-link v-b-modal.signin v-if="!user.id" class="ml-1">
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
    </footer>
    <b-modal id="signin" title="Sign In" @ok="doSignIn">
      <b-row class="my-1">
        <b-col cols="12" class="mb-3">
          As an admin you can help keeping the track database up-to date. If you are intrested in don't hesitate to contact me.
        </b-col>
        <b-col sm="2">
          <label for="input-email">Email:</label>
        </b-col>
        <b-col sm="10">
          <b-form-input v-model="form.user" id="input-email" size="sm" placeholder="Enter your email" />
        </b-col>
      </b-row>
      <b-row class="my-1">
        <b-col sm="2">
          <label for="input-password">Password:</label>
        </b-col>
        <b-col sm="10">
          <b-form-input v-model="form.pass" id="input-password" size="sm" placeholder="Enter your password" type="password" />
        </b-col>
      </b-row>
    </b-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive } from '@vue/composition-api'
import { signIn, useUser } from '@/firebase'
import { useSpotifyUser } from './auth'
export default defineComponent({
  name: 'App',
  metaInfo: {
    title: 'Spotify Agent',
    link: [{ rel: 'icon favicon', type: 'image/svg', href: 'favicon.svg' }],
  },
  setup() {
    const { BUILD_GIT_COMMIT_HASH, NODE_ENV, BUILD_TIME } = process.env
    const form = reactive({ user: '', pass: '' })
    const spotifyUser = useSpotifyUser()
    const user = useUser()

    return {
      env: { BUILD_GIT_COMMIT_HASH, NODE_ENV, BUILD_TIME },
      form,
      user,
      spotifyUser,
      doSignIn() {
        signIn(form.user, form.pass)
      },
    }
  },
})
</script>
<style lang="scss" scoped>
footer {
  text-align: right;
  position: fixed;
  top: 6em;
  width: 100%;
  font-size: 0.6em;
  padding-right: 10px;
}
</style>
