<template>
  <sl-button
    v-if="state.canAccess"
    variant="danger"
    size="small"
    :disabled="!state.active"
    :title="state.current['dest']['name']"
    @click="openScriptor"
  >
    <sl-icon
      v-if="state.current['icon']"
      slot="prefix"
      :name="state.current['icon']?.split('___')[1]"
      :library="state.current['icon']?.split('___')[0]"
    ></sl-icon>
    <template v-else>
      {{ state.current["dest"]["name"] }}
    </template>
  </sl-button>
</template>

<script lang="ts">
//@ts-nocheck
import { reactive, defineComponent, inject, computed } from "vue"
import { Request } from "@viur/vue-utils"
import { useMessageStore } from "../stores/message"
import { useDBStore } from "../stores/db"
import { useRoute } from "vue-router"
import { useUserStore } from "../stores/user"
import { useModulesStore } from "../stores/modules"

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
    const userStore = useUserStore()
    const route = useRoute()
    const state = reactive({
      active: computed(() => {
        return handlerState.currentSelection && handlerState.currentSelection.length > 0
      }),
      current: computed(() => {
        let scriptKey = props.name.replace("scriptor_", "")
        let currentConfig = modulesStore.state.modules[props.module]["scripts"].filter(
          (x) => x["dest"]["key"] === scriptKey
        )
        return currentConfig[0]
      }),
      canAccess: computed(() => {
        if (userStore.state.user.access.indexOf("root") !== -1) {
          return true
        }
        return userStore.state.user.access.indexOf(`${handlerState.module}-delete`) > -1
      }),
      opened: false
    })

    function openScriptor() {
      state.opened = true
    }

    return { state, openScriptor }
  }
})
</script>

<style scoped></style>
