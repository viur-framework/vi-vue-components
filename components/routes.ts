// @ts-nocheck
import view_missing from "./views/view_missing.vue"
import { createRouter, createWebHashHistory } from "vue-router"
import { useUserStore } from "./stores/user"
import { useContextStore } from "./stores/context"
import home from "./views/home.vue"

const default_routes = [
  {
    path: "/:pathMatch(.*)*",
    name: "view_missing",
    component: view_missing
  },
  {
    path: "/",
    name: "home",
    component: home
  },
  {
    path: "/db/:module/list/:group?",
    name: "list",
    props: true,
    component: () => import("./views/list.vue")
  },
  {
    path: "/db/:module/tree",
    name: "tree",
    props: true,
    component: () => import("./views/tree.vue")
  },
  {
    path: "/db/:module/tree.node",
    name: "hierarchy",
    props: true,
    component: () => import("./views/hierarchy.vue")
  },
  {
    path: "/db/:module",
    name: "singleton",
    props: true,
    component: () => import("./views/singleton.vue")
  },
  {
    path: "/db/:module/edit/:group?/:skelkey",
    name: "edit",
    meta: { action: "edit" },
    props: true,
    component: () => import("./views/edit.vue")
  },
  {
    path: "/db/:module/add/:group?",
    name: "add",
    meta: { action: "add" },
    props: true,
    component: () => import("./views/edit.vue")
  },
  {
    path: "/db/:module/add/:skeltype/:skelkey",
    name: "addnode",
    meta: { action: "add" },
    props: true,
    component: () => import("./views/edit.vue")
  },
  {
    path: "/db/:module/edit/:skeltype/:skelkey",
    name: "editnode",
    meta: { action: "edit" },
    props: true,
    component: () => import("./views/edit.vue")
  },
  {
    path: "/db/:module/clone/:skeltype?/:skelkey",
    name: "clone",
    meta: { action: "clone" },
    props: true,
    component: () => import("./views/edit.vue")
  },
  {
    path: "/db/:module/fluidpage/:parentmodule/:key?",
    name: "fluidpage",
    props: true,
    component: () => import("./views/fluidpage.vue")
  },
  {
    path: "/db/scriptor/frame/:key",
    name: "script",
    props: true,
    component: () => import("./views/script.vue")
  }
]

function createRouterInstance(routes, replace = false) {
  let newRoutes = []
  if (replace) {
    newRoutes = routes
  } else {
    newRoutes = routes.concat(default_routes)
  }

  const router = createRouter({
    // @ts-ignore
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: newRoutes
  })

  router.afterEach((to, from) => {
    //useUserStore().addAction();
  })

  router.beforeEach((to, from, next) => {
    const contextStore = useContextStore()
    let localContext = {}
    let handlerId = to.query["_"]?.toString()
    if (!handlerId) next()
    if (Object.keys(contextStore.state.localContext).includes(handlerId)) {
      localContext = contextStore.state.localContext[handlerId]
    }
    let newQuery = { ...contextStore.state.globalContext, ...localContext, ...to.query }
    if (
      Object.keys(to.query).every(
        (key) => to.query[key] === newQuery[key] && to.query.hasOwnProperty(key) && newQuery.hasOwnProperty(key)
      ) &&
      Object.keys(newQuery).every(
        (key) => to.query[key] === newQuery[key] && to.query.hasOwnProperty(key) && newQuery.hasOwnProperty(key)
      )
    ) {
      for (const [k, v] of Object.entries(to.query)) {
        if (k.startsWith("_")) continue
        if (Object.keys(contextStore.state.localContext).includes(handlerId)) {
          contextStore.state.localContext[handlerId][k] = v
        } else {
          contextStore.state.localContext[handlerId] = { [k]: v }
        }
      }
      next() // no change
    } else {
      to.query = newQuery
      next(to)
    }
  })
  return router
}

export default createRouterInstance
