<template>
  <div id="app">
    <b-navbar toggleable="lg" type="dark" variant="info" id="nav">
      <b-navbar-brand to="/">
        <img
          src="favicon.svg"
          class="d-inline-block align-top mr-2"
          alt="SA logo"
          height="30em"
          width="30em"
        />
        Spotify Agent
      </b-navbar-brand>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item to="/">Home</b-nav-item>
          <b-nav-item to="/about">About</b-nav-item>
        </b-navbar-nav>

        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">
          <b-nav-item href="#" v-b-toggle.sidebar-debug>JSON</b-nav-item>
          <b-nav-item href="/status">Status</b-nav-item>
          <b-nav-item href="/logout">Logout</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
    <router-view class="mt-4" />
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
})
</script>
