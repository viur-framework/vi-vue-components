<template>
  <the-topbar></the-topbar>

  <sl-split-panel class="split-panel" position-in-pixels="300" snap="300px">
    <div class="sidebar" slot="start">
      <the-sidebar></the-sidebar>
    </div>

    <div class="content" slot="end">
      <the-main-screen-tabbar></the-main-screen-tabbar>
      <router-view v-slot="{ Component }">
        <view-wrapper :component="Component"></view-wrapper>
      </router-view>
    </div>
  </sl-split-panel>

  <the-main-screen-skel-drawer></the-main-screen-skel-drawer>

  <message-drawer></message-drawer>

  <div id="dialogs"></div>
</template>

<script lang="ts">
//@ts-nocheck
import TheTopbar from "../TheMainScreenTopbar.vue";
import TheSidebar from "../TheMainScreenSidebar.vue";
import { useRoute, useRouter } from "vue-router";
import { Request } from "@viur/viur-vue-utils";
import { defineComponent, onBeforeMount, unref } from "vue";
import { useDBStore } from "../../stores/db";

//default top actions
import ViAction from "../../components/TopBarActions/vi.vue";
import LogAction from "../../components/TopBarActions/log.vue";
import MessageDrawer from "../Messaging/MessageDrawer.vue";
import TheMainScreenSkelDrawer from "../TheMainScreenSkelDrawer.vue";
import ViewWrapper from "../ViewWrapper.vue";
import TheMainScreenTabbar from "../TheMainScreenTabbar.vue";
import { useUserStore } from "../../stores/user";

export default defineComponent({
  components: {
    TheMainScreenTabbar,
    ViewWrapper,
    TheMainScreenSkelDrawer,
    MessageDrawer,
    TheTopbar,
    TheSidebar,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const dbStore = useDBStore();

    function collectViurConfig() {
      Request.get("/vi/config").then(async (resp: Response) => {
        let data = await resp.json();
        dbStore.state["vi.name"] = data["configuration"]["vi.name"];
        dbStore.state["vi.modules.groups"] =
          data["configuration"]["moduleGroups"];
        dbStore.state["vi.modules"] = data["modules"];

        if (route.path !== "/") {
          let new_route = router.resolve(unref(route));
          dbStore.addOpened(
            new_route,
            new_route.params["module"],
            new_route.query["view"]
          );
        }
      });
      Request.get("/vi/getVersion").then(async (resp: Response) => {
        let data = await resp.json();
        dbStore.state["core.version"] = data;
      });
    }

    function initTopBarActions() {
      dbStore.addTopBarAction(LogAction);
      dbStore.addTopBarAction(ViAction);
    }

    onBeforeMount(() => {
      collectViurConfig();
      initTopBarActions();
    });

    return {
      route,
    };
  },
});
</script>

<style scoped lang="less">
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
</style>
