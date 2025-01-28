<template>
  <router-link
    v-slot="{ route }"
    :to="state.url"
    custom
  >
    <sl-button
      size="small"
      outline
      variant="info"
      :disabled="!state.active || !state.canEdit"
      :title="$t('actions.fluidpage.edit')"
      @click="createAndNavigate(route)"
    >
      <sl-icon
        slot="prefix"
        name="newspaper"
      ></sl-icon>
    </sl-button>
  </router-link>
</template>

<script setup>
import { reactive, defineComponent, inject, computed } from "vue"
import { useRoute } from "vue-router"
import { useDBStore } from "../stores/db"
import { useUserStore } from "@viur/vue-utils/login/stores/user"
import { useContextStore } from "../stores/context"

    const handlerState = inject("handlerState")
    const dbStore = useDBStore()
    const userStore = useUserStore()
    const contextStore = useContextStore()
    const currentRoute = useRoute()
    const state = reactive({
      active: computed(() => {
        return handlerState.currentSelection && handlerState.currentSelection.length > 0
      }),
      contentModule: computed(() => {
        let conf = dbStore.getConf(handlerState.module)
        let module = conf["handler"].split(".").at(-1).replace("/", ".")
        return module
      }),
      url: computed(() => {
        if (!state.active) return ""
        return `/db/${state.contentModule}/fluidpage/${currentRoute.params["module"]}/${handlerState.currentSelection[0]["key"]}`
      }),
      canEdit: computed(() => {
        if (userStore.state.user.access.indexOf("root") !== -1) {
          return true
        }
        return userStore.state.user.access.indexOf(`${handlerState.module}-edit`) > -1
      })
    })

    function createAndNavigate(route) {
      contextStore.setContext("fluidpage", handlerState.currentSelection[0]["key"], currentRoute.query["_"])
      dbStore.addOpened(route, state.contentModule,null,handlerState.currentSelection[0]["name"])
    }
</script>

<style scoped></style>
