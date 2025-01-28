<template>
  <sl-split-panel
    class="split-panel"
    position-in-pixels="300"
    snap="300px"
  >
    <div
      slot="start"
      class="sidebar"
    >

    </div>

    <div
      slot="end"
      class="content"
    >
      <router-view v-slot="{ Component }">
        <div class="viewwrapper">
          <div class="wrap-for-popup">
            <template v-for="tab in dbStore.state['handlers.opened']">
              <div
                v-show="dbStore.getActiveTab()['id'] === tab?.['id']"
                :id="'view_dialogs_' + tab?.['id']"
              ></div>
            </template>


          <sl-tab-group class="viewtabgroup" placement="end" variant="flap"  style="height: 100%;display:flex;flex-direction:column;">
            <sl-tab slot="nav" v-if="state.activeTabs!==0"> <sl-icon name="database-fill"></sl-icon></sl-tab>
            <template v-for="ext in extensionsStore.state.extensions">
              <template v-for="handler in ext?.['subhandlers']" :key="handler['name']">
                <sl-tab slot="nav"  v-if="evaluateTabs(handler)"><sl-icon :title="handler['name']" :name="handler['icon']"></sl-icon></sl-tab>
              </template>
            </template>

            <sl-tab-panel name="default" class="viewpanel" style="height: 100%;display:flex;flex-direction:column;flex:1">
              <view-wrapper :component="Component"></view-wrapper>
            </sl-tab-panel>


          </sl-tab-group>
        </div>
        </div>
      </router-view>
    </div>
  </sl-split-panel>
  <the-main-screen-skel-drawer></the-main-screen-skel-drawer>
</template>
<script setup>
import TheMainScreenSkelDrawer from "../main/TheMainScreenSkelDrawer.vue"
import TheSidebar from "../main/TheMainScreenSidebar.vue"
import TheMainScreenTabbar from "../main/TheMainScreenTabbar.vue"
import ViewWrapper from "../main/ViewWrapper.vue"
import { useDBStore } from "../stores/db"
import { useExtensionsStore } from "../stores/extensions";
import { useRoute} from "vue-router";
import { reactive } from "vue"


const dbStore = useDBStore()
const extensionsStore = useExtensionsStore()
const route = useRoute()

const state = reactive({
  activeTabs:0
})

function evaluateTabs(handler){
  let match = true
  if(handler?.['routeMatches']){
    for(const [k,v] of Object.entries(handler?.['routeMatches'])){
      if (route.params[k] !== v && route.meta[k] !== v){
        match = false
      }
    }
  }
  if (match){
    state.activeTabs++
  }

  return match
}

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

.viewpanel::part(base){
  padding:0;
  display:flex;
  flex:1;
  flex-direction:column;
  height: 100%;
  overflow:hidden;

}

.viewtabgroup::part(nav){
  border-left: 1px solid var( --vi-divider-color);
}


.viewtabgroup::part(base){
  flex:1;
  overflow:hidden;
}

.viewtabgroup{
  & sl-tab::part(base){
    padding:10px;
  }
}

.viewwrapper{
  height: 100%;
  display:flex;
  flex-direction:column;
  overflow:auto
}
</style>
