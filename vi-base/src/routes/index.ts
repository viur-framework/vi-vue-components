import view_missing from "../views/view_missing.vue";
import {createRouter, createWebHashHistory} from "vue-router";
import listview from '../views/list.vue'
import treeview from '../views/tree.vue'
import hierarchy from '../views/hierarchy.vue'
import singletonview from '../views/singleton.vue'
import editview from '../views/edit.vue'
import homeview from '../views/home.vue'
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
    component: homeview
  },
  {
    path: '/:module/list/:group?',
    name: 'list',
    props: true,
    component: listview
  },
  {
    path: '/:module/tree',
    name: 'tree',
    props: true,
    component: treeview
  },
  {
    path: '/:module/tree.node',
    name: 'hierarchy',
    props: true,
    component: hierarchy
  },
  {
    path: '/:module',
    name: 'singleton',
    props: true,
    component: singletonview
  },
  {
    path: '/:module/edit/:skelkey',
    name: 'edit',
    meta: {"action": "edit"},
    props: true,
    component: editview
  },
  {
    path: '/:module/add',
    name: 'add',
    meta: {"action": "add"},
    props: true,
    component: editview
  },
  {
    path: '/:module/add/:skeltype/:skelkey',
    name: 'addnode',
    meta: {"action": "add"},
    props: true,
    component: editview
  },
  {
    path: '/:module/edit/:skeltype/:skelkey',
    name: 'editnode',
    meta: {"action": "edit"},
    props: true,
    component: editview
  },
  {
    path: '/:module/clone/:skelkey',
    name: 'clone',
    meta: {"action": "clone"},
    props: true,
    component: editview
  },

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
