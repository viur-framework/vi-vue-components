<template>
  <router-link
    v-slot="{ route }"
    :to="state.url"
    custom
  >
  <sl-button
    v-if="state.canAccess"
    size="small"
    :disabled="!state.active"
    :title="state.current['dest']['name']"
    @click="createAndNavigate(route)"
  >
    <sl-icon
      v-if="state.current['rel']['icon']"
      slot="prefix"
      :name="state.current['rel']['icon']?.split('___')[1]"
      :library="state.current['rel']['icon']?.split('___')[0]"
    ></sl-icon>
    <template v-else>
      {{ state.current["dest"]["name"] }}
    </template>
  </sl-button>
  </router-link>
</template>

<script lang="ts">
//@ts-nocheck
import { reactive, defineComponent, inject, computed } from "vue"
import { Request } from "@viur/vue-utils"
import { useMessageStore } from "../stores/message"
import { useRoute } from "vue-router"
import { useUserStore } from "../stores/user"
import { useModulesStore } from "../stores/modules"
import {useAppStore} from "../stores/app";
import { useDBStore } from "../stores/db"

export default defineComponent({
  props: {
    name: String
  },
  components: {},
  setup(props, context) {
    const handlerState: any = inject("handlerState")
    const tableReload: any = inject("reloadAction")
    const messageStore = useMessageStore()
    const modulesStore = useModulesStore()
    const appStore = useAppStore()
    const userStore = useUserStore()
    const dbStore = useDBStore()
    const route = useRoute()
    const state = reactive({
      active: computed(() => {
        if (state.current['rel']['capable']==='none'){
          return true
        }
        return handlerState.currentSelection && handlerState.currentSelection.length > 0
      }),
      scriptKey:computed(()=>{
        return props.name.replace("scriptor_", "")
      }),
      current: computed(() => {
        let currentConfig = modulesStore.state.modules[handlerState.module]["scripts"].filter(
          (x) => x["dest"]["key"] === state.scriptKey
        )
        return currentConfig[0]
      }),
      canAccess: computed(() => {
        if (userStore.state.user.access.indexOf("root") !== -1) {
          return true
        }
        return userStore.state.user.access.indexOf(`${handlerState.module}-delete`) > -1
      }),
      opened: false,
      url: computed(() => {
        let url = `/db/scriptor/frame/${state.scriptKey}`

        if (handlerState.currentSelection){
         let params =  Object.fromEntries(handlerState.currentSelection.map((i,idx) => [`key${(idx===0)?'':idx}`,i['key']]))
          url += "?" + new URLSearchParams(params).toString()
        }

        return url
      })
    })

    function createAndNavigate(route: any) {
      dbStore.addOpened(route, handlerState["module"], handlerState["view"])
    }

    return { state, createAndNavigate }
  }
})
</script>

<style scoped></style>
