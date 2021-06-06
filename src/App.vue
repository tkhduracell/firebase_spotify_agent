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
          <b-nav-item-dropdown text="Tools" right>
            <b-dropdown-item active-class="active" :to="{ name: 'Recommendations' }">Song finder</b-dropdown-item>
            <b-dropdown-item active-class="active" :to="{ name: 'PlaylistInspect' }">Playlist Inspector</b-dropdown-item>
            <b-dropdown-item active-class="active" :to="{ name: 'PlaylistCreate' }">Playlist Creator</b-dropdown-item>
          </b-nav-item-dropdown>
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
      <b-link v-b-modal.signin v-if="!user.id" class="ml-1">Sign In</b-link>
    </footer>
    <b-modal id="signin" title="Sign In" @ok="doSignIn">
      <b-row class="my-1">
        <b-col sm="2">
          <label for="input-email">Email:</label>
        </b-col>
        <b-col sm="10">
          <b-form-input v-model="form.user" id="input-email" size="sm" placeholder="Enter your email"></b-form-input>
        </b-col>
      </b-row>
      <b-row class="my-1">
        <b-col sm="2">
          <label for="input-password">Password:</label>
        </b-col>
        <b-col sm="10">
          <b-form-input v-model="form.pass" id="input-password" size="sm" placeholder="Enter your password"></b-form-input>
        </b-col>
      </b-row>
    </b-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive } from '@vue/composition-api'
import { signIn, useUser } from '@/firebase'
export default defineComponent({
  name: 'App',
  metaInfo: {
    title: 'Spotify Agent',
    link: [{ rel: 'icon favicon', type: 'image/svg', href: 'favicon.svg' }],
  },
  setup() {
    const { BUILD_GIT_COMMIT_HASH, NODE_ENV, BUILD_TIME } = process.env
    const form = reactive({ user: '', pass: '' })
    const user = useUser()

    return {
      env: { BUILD_GIT_COMMIT_HASH, NODE_ENV, BUILD_TIME },
      form,
      user,
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
  bottom: 0;
  width: 100%;
  font-size: 0.6em;
  padding-right: 10px;
}
</style>
