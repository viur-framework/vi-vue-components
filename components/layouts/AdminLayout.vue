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
      <the-sidebar></the-sidebar>
    </div>

    <div
      slot="end"
      class="content"
    >
      <the-main-screen-tabbar></the-main-screen-tabbar>
      <router-view v-slot="mainprops">
        <div class="viewwrapper">
          <div class="wrap-for-popup">
            <template v-for="tab in dbStore.state['handlers.opened']">
              <div
                v-show="dbStore.getActiveTab()['id'] === tab?.['id']"
                :id="'view_dialogs_' + tab?.['id']"
              ></div>
            </template>
            <sl-tab-group class="viewtabgroup" placement="end" variant="flap"  style="height: 100%;display:flex;flex-direction:column;">
              <sl-tab slot="nav" v-if="state.validHandlers.length>0" @click="navigateSubRoute()"> <sl-icon name="database-fill"></sl-icon></sl-tab>
                <template v-for="handler in state.validHandlers" :key="handler['name']">
                  <sl-tab slot="nav" @click="navigateSubRoute(handler['route'])"><sl-icon :title="handler['name']" :name="handler['icon']"></sl-icon></sl-tab>
                </template>

              <sl-tab-panel name="default" class="viewpanel" style="height: 100%;display:flex;flex-direction:column;flex:1">
                <view-wrapper :component="mainprops.Component">
                </view-wrapper>
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
import { useRoute, useRouter} from "vue-router";
import {reactive, computed, unref, onMounted} from "vue"

const dbStore = useDBStore()
const extensionsStore = useExtensionsStore()
const route = useRoute()
const router = useRouter()

const state = reactive({
  validHandlers:computed(()=>{
    let validHandlers = []
    let match = true

    for(const [extname,ext] of Object.entries(extensionsStore.state.extensions)){
      if (ext?.['subhandlers']){
        for (const [hname, handler] of Object.entries(ext['subhandlers'])){
          if(handler?.['routeMatches']){
            for(const [k,v] of Object.entries(handler?.['routeMatches'])){
              if (route.params[k] !== v && route.meta[k] !== v){
                match = false
              }
            }
          }

          if (match){
            validHandlers.push(handler)
          }
        }
      }
    }
    return validHandlers
  })


})

function navigateSubRoute(subroute){
  let org_path = route.path
  if (!org_path.endsWith(subroute)){
    org_path+="/"+subroute
  }
  org_path +="?_="+route.query["_"]

  if (!subroute){
    org_path = route.path.split("__")[0]+"?_="+route.query["_"]
  }
  let new_route = router.resolve(unref(org_path))
  router.push(new_route)
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
