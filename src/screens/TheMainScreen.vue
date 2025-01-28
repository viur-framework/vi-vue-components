<template>
  <template v-if="!state.access">
    <div class="wrapper">
      <sl-dialog
        open
        :label="$t('noaccess.title')"
        @sl-request-close="$event.preventDefault()"
      >
        {{ $t("noaccess.descr") }}
        <div style="margin-top: 10px">
          <sl-button
            variant="danger"
            @click="userStore.logout()"
          >
            {{ $t("login.logout") }}
          </sl-button>
        </div>
      </sl-dialog>
    </div>
  </template>
  <template v-else-if="state.status === 'ready'">
    <the-topbar></the-topbar>

    <component :is="getLayout()">
    </component>

    <message-drawer></message-drawer>

    <div id="dialogs"></div>
  </template>
</template>

<script setup>
import TheTopbar from "../main/TheMainScreenTopbar.vue"
import { useRoute, useRouter } from "vue-router"
import { Request } from "@viur/vue-utils"
import { onBeforeMount, unref, h, reactive, computed } from "vue"
import { useDBStore } from "../stores/db"
import { useAppStore } from "../stores/app"
import { getLayout } from "../layouts/layouts";

//default top actions
import ViAction from "../main/topbar/vi.vue"
import LogAction from "../main/topbar/log.vue"
import MessageDrawer from "../main/messages/MessageDrawer.vue"
import { useUserStore } from "@viur/vue-utils/login/stores/user"

const route = useRoute()
const router = useRouter()
const dbStore = useDBStore()
const appStore = useAppStore()
const userStore = useUserStore()

const state = reactive({
  backgroundImage: computed(() => `url('${appStore.state["admin.login.background"]}'`),
  access: computed(() => {
    if (
      userStore.state.user &&
      (userStore.state.user["access"].includes("root") || userStore.state.user["access"].includes("admin"))
    ) {
      return true
    }
    return false
  }),
  status: "loading"
})

function collectViurConfig() {
  Request.get("/vi/config").then(async (resp) => {

    //preflight check
    try{
      await Request.get("/json/skey",{headers:{"x-viur-bonelist":"check"}})
      appStore.state.preflights = false
    }catch (error){
      appStore.state.preflights = false
    }


    let data = await resp.json()
    dbStore.state["vi.name"] = data["configuration"]["vi.name"]

    for (const group of ["admin.module.groups", "module.groups", "module_groups", "moduleGroups"]) {
      if (Object.keys(data["configuration"]).includes(group)) {
        dbStore.state["vi.modules.groups"] = data["configuration"][group]
        break
      }
    }

    let currentModules = Object.entries(data["modules"]).map((i) => {
      i[0] = i[0].replace(".", "/")
      return i
    })

    dbStore.state["vi.modules"] = currentModules.reduce((obj, i) => {
      obj[i[0]] = i[1]
      return obj
    }, {})

    dbStore.state["vi.moduleTree"] = dbStore.modulesTree()
    if (route.path !== "/") {
      let new_route = router.resolve(unref(route))
      dbStore.addOpened(
        new_route,
        new_route.params["module"]?.replace(".", "/") ? new_route.params["module"]?.replace(".", "/") : "",
        new_route.query["view"]
      )
    }

    state.status = "ready"
  })
  Request.get("/vi/getVersion").then(async (resp) => {
    let data = await resp.json()
    appStore.state["core.version"] = data
  })
}

function initTopBarActions() {
  dbStore.addTopBarAction(LogAction)
  dbStore.addTopBarAction(ViAction)
}

function urlToRoute(tab) {
  let ViewComponent = tab.to
  if (!ViewComponent.matched) {
    ViewComponent = router.resolve(ViewComponent)
  }

  const component = h(ViewComponent.matched[0].components.default, {
    ...ViewComponent.params
  })
  return () => component
}

onBeforeMount(() => {
  collectViurConfig()
  initTopBarActions()
})




</script>

<style scoped>
.wrapper {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: v-bind("state.backgroundImage");
  background-position: center center;
  background-size: cover;
}
</style>
