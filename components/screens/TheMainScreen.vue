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
  <template v-else>
    <the-topbar></the-topbar>

    <sl-split-panel
      class="split-panel"
      position-in-pixels="300"
      snap="300px"
    >
      <div
        slot="start"
        class="sidebar"
      >
        <the-sidebar></the-sidebar>
      </div>

      <div
        slot="end"
        class="content"
      >
        <the-main-screen-tabbar></the-main-screen-tabbar>
        <router-view v-slot="{ Component }">
          <div class="wrap-for-popup">
            <template v-for="tab in dbStore.state['handlers.opened']">
              <div
                v-show="dbStore.getActiveTab()['id'] === tab?.['id']"
                :id="'view_dialogs_' + tab?.['id']"
              ></div>

              <!--<template v-if="!tab['keep']">
              <component
                :is="urlToRoute(tab)"
                v-show="dbStore.getActiveTab()['id'] === tab?.['id']"
              ></component>
            </template>-->
            </template>
            <view-wrapper :component="Component"></view-wrapper>
          </div>
        </router-view>
      </div>
    </sl-split-panel>
    <the-main-screen-skel-drawer></the-main-screen-skel-drawer>

    <message-drawer></message-drawer>

    <div id="dialogs"></div>
  </template>
</template>

<script lang="ts">
//@ts-nocheck
import TheTopbar from "../main/TheMainScreenTopbar.vue"
import TheSidebar from "../main/TheMainScreenSidebar.vue"
import { useRoute, useRouter } from "vue-router"
import { Request } from "@viur/vue-utils"
import { defineComponent, onBeforeMount, unref, h, reactive, computed } from "vue"
import { useDBStore } from "../stores/db"
import { useAppStore } from "../stores/app"

//default top actions
import ViAction from "../main/topbar/vi.vue"
import LogAction from "../main/topbar/log.vue"
import MessageDrawer from "../main/messages/MessageDrawer.vue"
import TheMainScreenSkelDrawer from "../main/TheMainScreenSkelDrawer.vue"
import ViewWrapper from "../main/ViewWrapper.vue"
import TheMainScreenTabbar from "../main/TheMainScreenTabbar.vue"
import { useUserStore } from "../stores/user"

export default defineComponent({
  components: {
    TheMainScreenTabbar,
    ViewWrapper,
    TheMainScreenSkelDrawer,
    MessageDrawer,
    TheTopbar,
    TheSidebar
  },
  setup() {
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
      })
    })

    function collectViurConfig() {
      Request.get("/vi/config").then(async (resp: Response) => {
        let data = await resp.json()
        dbStore.state["vi.name"] = data["configuration"]["vi.name"]
        if (Object.keys(data["configuration"]).includes("module_groups")) {
          dbStore.state["vi.modules.groups"] = data["configuration"]["module_groups"]
        } else if (Object.keys(data["configuration"]).includes("moduleGroups")) {
          dbStore.state["vi.modules.groups"] = data["configuration"]["moduleGroups"]
        }

        let currentModules = Object.entries(data["modules"]).map((i) => {
          i[0] = i[0].replace(".", "/")
          return i
        })

        dbStore.state["vi.modules"] = currentModules.reduce((obj, i) => {
          obj[i[0]] = i[1]
          return obj
        }, {})

        if (route.path !== "/") {
          let new_route = router.resolve(unref(route))
          dbStore.addOpened(new_route, new_route.params["module"].replace(".", "/"), new_route.query["view"])
        }
      })
      Request.get("/vi/getVersion").then(async (resp: Response) => {
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

    return {
      route,
      dbStore,
      urlToRoute,
      userStore,
      state
    }
  }
})
</script>

<style scoped>
.split-panel {
  --min: 300px;
  --max: 40%;
  --divider-width: 1px;

  flex: 1;
  height: 0;

  &::part(panel) {
    display: flex;
    flex-direction: column;
  }

  &::part(divider) {
    background-color: var(--vi-divider-color);
  }
}

.content {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 3px;
  }

  &:hover {
    &::-webkit-scrollbar-thumb {
      background-color: #afafaf;
    }
  }
}

.sidebar {
  overflow-y: auto;
  max-height: 100%;
  height: 100%;
}

.wrap-for-popup {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 1px;
  position: relative;
}

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
