import TopBarWidget from "./TopBarWidget.vue"
import { useDBStore } from "../../stores/db"
import { useRouter } from "vue-router"
const routes = [
  /*
  {
    path: "/scriptor/app",
    name: "ScriptorApp",
    meta: {
      layout: "ScriptorLayout",
    },
    component: () => import("./ScriptorApplication.vue"),
  },
  {
        path: "/db/:module/edit/leaf/:skelkey/scriptor/edit",
        name: "ScriptorEditor",
        meta: { action: "edit" },
        component: () => import("./ScriptorEditor.vue")
    }*/
]

export default function extensionInfo() {
  const dbStore = useDBStore()
  const router = useRouter()
  function init() {
    //console.log("Init Scriptor")
    //addSubRoute()
    //topbar()
  }

  function topbar() {
    dbStore.state["topbar.actions"].push(TopBarWidget)
  }

  function addSubRoute() {
    router.addRoute("edit", {
      path: "shop/edit",
      name: "Shop Details",
      meta: { action: "edit" },
      props: true,
      component: () => import("./OrderEditor.vue"),
    })
  }

  return {
    name: "shop",
    routes: routes,
    init: init,
    subhandlers: {
      editor: {
        routeMatches: {
          module: "shop.order",
          action: "edit",
        },
        name: "Details",
        icon: "basket-fill",
        route: "__/shop.order/edit",
      },
    },
  }
}
