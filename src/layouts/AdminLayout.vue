<template>
  <sl-split-panel
    class="split-panel"
    position-in-pixels="320"
    snap="320px"
    ref="splitpanel"
    :class="[state.sidebarOpen ? '' : 'sidebar-is-closed', state.sidebarResize ? 'is-animated' : '' ]"
  >
    <div
      slot="start"
      class="sidebar"
    >
      <the-sidebar @toggle-sidebar="toggleSidebar()">
      </the-sidebar>
      <div class="open-sidebar-overlay"
          v-if="!state.sidebarOpen"
          @click="openSidebar()"></div>
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
            <sl-tab-group class="viewtabgroup" placement="bottom">
              <sl-tab slot="nav" v-if="state.validHandlers.length>0" @click="navigateSubRoute()">
                <sl-icon name="database-fill"></sl-icon>
                Daten
              </sl-tab>
                <template v-for="handler in state.validHandlers" :key="handler['name']">
                  <sl-tab :title="handler['name']" slot="nav" @click="navigateSubRoute(handler['route'])">
                    <sl-icon :name="handler['icon']">
                    </sl-icon>
                    {{ handler['name'] }}
                  </sl-tab>
                </template>

              <sl-tab-panel name="default" class="viewpanel">
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
  sidebarOpen: true,
  sidebarResize: false,
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

function toggleSidebar(){
  state.sidebarOpen = !state.sidebarOpen;
  state.sidebarResize = true
  const timer = setTimeout(() => {
    state.sidebarResize = false
  clearTimeout(timer)
  }, 1000)
}

function openSidebar(){
  state.sidebarOpen = true;
  state.sidebarResize = true
  const timer = setTimeout(() => {
    state.sidebarResize = false
  clearTimeout(timer)
  }, 1000)
}

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

  let currentTab = dbStore.state['handlers.opened'][dbStore.state['handlers.active']]
  currentTab.to = new_route
}

</script>

<style scoped>
.split-panel {
  --min: 320px;
  --max: 40%;
  --divider-width: 2px;

  flex: 1;
  height: 100vh;

  &::part(panel) {
    display: flex;
    flex-direction: column;
  }

  &::part(divider){
    position: relative;
    z-index: 0;
  }

  &::part(start) {
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, .2);
    z-index: 1;
    overflow: visible;

    &:hover{
      background-color: var(--sl-color-primary-500);
    }
  }

  &.sidebar-is-closed{
    --min: 46px;
    --max: 46px;

    .sidebar{
      &:deep(.head){
        .info-icon{
          max-width: 0;
          margin-left: 0;
        }

        .logo{
          max-width: 0;
          padding-left: 0;
          padding-right: 0;
          margin-right: 0;
        }

        .sidebar-toggle{
          margin: 0 auto;
          transform: rotate(180deg);
        }
      }

      &:deep(.nav){
        pointer-events: none;

        .list{
          overflow: hidden;
        }

        .sublist{
          display: none;
        }
      }
    }
  }

  &.is-animated{
    transition: 400ms;
  }
}

.content {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  position: relative;
  z-index: 0;

  &::-webkit-scrollbar {
    width: 10px;
    height: 11px;
  }

  &::-webkit-scrollbar-thumb {
    border: 4px solid rgba(0, 0, 0, 0);
    border-right: 3px solid rgba(0, 0, 0, 0);
    background-clip: padding-box;
    border-radius: 9999px;
    background-color: var(--sl-color-neutral-200);
  }

  &:hover {
    &::-webkit-scrollbar-thumb {
      background-color: var(--sl-color-neutral-500);
    }
  }
}

.sidebar {
  display: flex;
  flex-direction: column;
  max-height: 100vh;
  height: 100%;
  position: relative;
  z-index: 1;
}

.open-sidebar-overlay{
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  cursor: pointer;
  z-index: 2;
}

.wrap-for-popup {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 1px;
  position: relative;
}

.viewpanel{
  height: 100%;
  display:flex;
  flex-direction:column;
  flex: 1;

  &::part(base){
    padding:0;
    display:flex;
    flex:1;
    flex-direction:column;
    height: 100%;
    overflow:hidden;
  }

}

.viewtabgroup{
  height: 100%;
  display:flex;
  flex-direction:column;

  &::part(base){
    flex:1;
    overflow:hidden;
  }

  &::part(body){
    flex:1;
  }

  &::part(nav){
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, .2);
    z-index: 1;
  }


  & sl-tab{
    &::part(base){
      font-size: .9em;
      padding: var(--sl-spacing-x-small) var(--sl-spacing-small);
      border-radius: 0;
      height: calc(var(--sl-input-height-medium) - 1px);
    }

    &[active]{
      &::part(base){
        color: var(--vi-foreground-color) !important;
      }

      sl-icon{
        background-color: var(--sl-color-primary-500);

        @supports (color: oklch(from red l c h)) {
          --l: clamp(0, (l / 0.623 - 1) * -infinity, 1);
          color: oklch(from var(--sl-color-primary-500) var(--l) 0 h);
          text-shadow: none;
        }

        @supports (color: contrast-color(red)) {
          color: contrast-color(var(--sl-color-primary-500));
          text-shadow: none;
        }
      }
    }

    sl-icon{
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2em;
      border: 1px solid var(--vi-border-color);
      border-radius: var(--sl-border-radius-medium);
      padding: var(--sl-spacing-2x-small);
      margin-right: var(--sl-spacing-x-small);
    }
  }
}

.viewwrapper{
  height: 100%;
  display:flex;
  flex-direction:column;
  overflow:auto;
  flex: 1;
}
</style>
