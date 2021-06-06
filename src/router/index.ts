import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/about',
    name: 'About',
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue'),
  },
  {
    path: '/recommendations',
    name: 'Recommendations',
    component: () => import(/* webpackChunkName: "recommendations" */ '../views/Recommendations.vue'),
  },
  {
    path: '/playlist',
    name: 'PlaylistInspect',
    component: () => import(/* webpackChunkName: "playlist-inspect" */ '../views/PlaylistInspect.vue'),
  },
  {
    path: '/create',
    name: 'PlaylistCreate',
    component: () => import(/* webpackChunkName: "playlist-create" */ '../views/PlaylistCreate.vue'),
  },
  {
    path: '/logout',
    beforeEnter() {
      window.location = ('https://accounts.spotify.com/en/logout' as unknown) as Location
    },
  },
  {
    path: '/status',
    beforeEnter() {
      window.location = ('https://accounts.spotify.com/sv/status' as unknown) as Location
    },
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
})

export default router
