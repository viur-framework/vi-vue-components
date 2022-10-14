<template>
    <the-topbar></the-topbar>

    <sl-split-panel class="split-panel" position-in-pixels="300" snap="300px">

        <div class="sidebar" slot="start">
            <the-sidebar></the-sidebar>
        </div>

        <div class="content" slot="end">
            <router-view v-slot="{ Component }">
                <keep-alive>
                    <component :is="Component" :key="route.fullPath"/>
                </keep-alive>
            </router-view>
        </div>

    </sl-split-panel>

    <the-main-screen-skel-drawer>

    </the-main-screen-skel-drawer>

    <message-drawer></message-drawer>
</template>

<script lang="ts">
//@ts-nocheck
import TheTopbar from "../TheMainScreenTopbar.vue";
import TheSidebar from "../TheMainScreenSidebar.vue";
import {useRoute} from "vue-router";
import {Request} from "@viur/viur-vue-utils";
import {defineComponent, onBeforeMount} from "vue";
import {useAppStore} from "../../stores/app";

//default top actions
import ViAction from "../../components/TopBarActions/vi.vue";
import LogAction from "../../components/TopBarActions/log.vue";
import MessageDrawer from "../Messaging/MessageDrawer.vue";
import TheMainScreenSkelDrawer from "../TheMainScreenSkelDrawer.vue";

export default defineComponent({
    components: {TheMainScreenSkelDrawer, MessageDrawer, TheTopbar, TheSidebar},
    setup() {
        const route = useRoute()
        const appStore = useAppStore()

        function collectViurConfig() {
            Request.get("/vi/config").then(async (resp: Response) => {
                let data = await resp.json()
                appStore.state["vi.name"] = data["configuration"]["vi.name"]
                appStore.state["vi.modules.groups"] = data["configuration"]["moduleGroups"]
                appStore.state["vi.modules"] = data["modules"]
            })
        }

        function initTopBarActions() {
            appStore.addTopBarAction(LogAction)
            appStore.addTopBarAction(ViAction)
        }

        onBeforeMount(() => {
            collectViurConfig()
            initTopBarActions()
        })

        return {
            route
        }
    }
})
</script>

<style scoped lang="less">
sl-split-panel {
    --min: 300px;
    --max: 40%;
    flex: 1;
  height: 0;

    &::part(panel){
      display: flex;
      flex-direction: column;
    }
}

.content {
    display: flex;
    flex-direction: column;
    flex: 1;
    background-color: #fff;

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

    &::-webkit-scrollbar-button {
        height: 6px;
    }

    &:hover {
        &::-webkit-scrollbar-thumb {
            background-color: #afafaf;
        }
    }
}

</style>
