import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Player from '../views/Player.vue'
import Callback from '../views/Callback.vue'
import Login from '../views/Login.vue'
import Start from '../views/Start.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Start',
    component: Start
  },
  {
    path: '/player',
    name: 'Player',
    component: Player
  },
  {
    path: '/about',
    name: 'About',
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  },
  {
    path: '/recommendations',
    name: 'Recommendations',
    component: () => import(/* webpackChunkName: "recommendations" */ '../views/Recommendations.vue')
  },
  {
    path: '/playlist',
    name: 'PlaylistInspect',
    component: () => import(/* webpackChunkName: "playlist-inspect" */ '../views/PlaylistInspect.vue')
  },
  {
    path: '/create',
    name: 'PlaylistCreate',
    component: () => import(/* webpackChunkName: "playlist-create" */ '../views/PlaylistCreate.vue')
  },
  {
    path: '/logout',
    beforeEnter () {
      window.location = ('https://accounts.spotify.com/en/logout' as unknown) as Location
    }
  },
  {
    path: '/status',
    beforeEnter () {
      window.location = ('https://accounts.spotify.com/sv/status' as unknown) as Location
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/callback',
    name: 'Callback',
    component: Callback
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
