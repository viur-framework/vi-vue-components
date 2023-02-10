import view_missing from "../views/view_missing.vue";
import {createRouter, createWebHashHistory} from "vue-router";
import {useUserStore} from "../stores/user";

const routes = [
  {
    path: '/:pathMatch(.*)*',
    name: 'view_missing',
    component: view_missing
  },
  {
    path: '/',
    name: 'home',
    component: () => import("../views/home.vue")
  },
  {
    path: '/:module/list/:group?',
    name: 'list',
    props: true,
    component: () => import("../views/list.vue")
  },
  {
    path: '/:module/tree',
    name: 'tree',
    props: true,
    component: () => import("../views/tree.vue")
  },
  {
    path: '/:module/tree.node',
    name: 'hierarchy',
    props: true,
    component: () => import("../views/hierarchy.vue")
  },
  {
    path: '/:module',
    name: 'singleton',
    props: true,
    component: () => import("../views/singleton.vue")
  },
  {
    path: '/:module/edit/:group?/:skelkey',
    name: 'edit',
    meta: {"action": "edit"},
    props: true,
    component: () => import("../views/edit.vue")
  },
  {
    path: '/:module/add/:group?',
    name: 'add',
    meta: {"action": "add"},
    props: true,
    component: () => import("../views/edit.vue")
  },
  {
    path: '/:module/add/:skeltype/:skelkey',
    name: 'addnode',
    meta: {"action": "add"},
    props: true,
    component: () => import("../views/edit.vue")
  },
  {
    path: '/:module/edit/:skeltype/:skelkey',
    name: 'editnode',
    meta: {"action": "edit"},
    props: true,
    component: () => import("../views/edit.vue")
  },
  {
    path: '/:module/clone/:group?/:skelkey',
    name: 'clone',
    meta: {"action": "clone"},
    props: true,
    component: () => import("../views/edit.vue")
  },
    {
    path: '/:module/fluidpage/:key?',
    name: 'fluidpage',
    props: true,
    component: () => import("../views/fluidpage.vue")
  }


]


const router = createRouter({
  // @ts-ignore
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})
router.afterEach((to, from) => {
  useUserStore().addAction();
})
export default router
