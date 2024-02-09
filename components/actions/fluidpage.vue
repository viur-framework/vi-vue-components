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

<script lang="ts">
// @ts-nocheck
import { reactive, defineComponent, inject, computed } from "vue"
import { useRoute } from "vue-router"
import { useDBStore } from "../stores/db"
import { useUserStore } from "../stores/user"
import { useContextStore } from "../stores/context"

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const handlerState: any = inject("handlerState")
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

    function createAndNavigate(route: any) {
      contextStore.setContext("fluidpage.dest.key", handlerState.currentSelection[0]["key"], currentRoute.query["_"])
      dbStore.addOpened(route, state.contentModule)
    }

    return {
      state,
      handlerState,
      createAndNavigate
    }
  }
})
</script>

<style scoped></style>
