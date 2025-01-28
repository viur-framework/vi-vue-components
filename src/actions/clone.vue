<template>
  <sl-button
    :disabled="!state.active || !state.canAdd"
    size="small"
    :title="$t('actions.clone')"
    @click="createAndNavigate()"
  >
    <sl-icon
      slot="prefix"
      name="copy"
      sprite
    ></sl-icon>
  </sl-button>
</template>

<script setup>

import { reactive, defineComponent, inject, computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useDBStore } from "../stores/db"
import { useUserStore } from "@viur/vue-utils/login/stores/user"

    const handlerState = inject("handlerState")
    const dbStore = useDBStore()
    const userStore = useUserStore()
    const route = useRoute()
    const router = useRouter()
    const state = reactive({
      active: computed(() => {
        return handlerState.currentSelection && handlerState.currentSelection.length > 0
      }),
      urls: computed(() => {
        let urls = []
        if (!state.active) return urls

        for (let selection of handlerState.currentSelection) {
          if (handlerState.type === "hierarchyhandler") {
            urls.push(`/db/${handlerState.module}/clone/node/${selection["key"]}`)
            continue
          }

          if (handlerState.type === "treehandler") {
            urls.push(`/db/${handlerState.module}/clone/${handlerState?.currentSelectionType}/${selection["key"]}`)
            continue
          }
          if (handlerState.group) {
            urls.push(`/db/${handlerState.module}/clone/${handlerState.group}/${selection["key"]}`)
          } else {
            urls.push(`/db/${handlerState.module}/clone/${selection["key"]}`)
          }
        }
        return urls
      }),
      canAdd: computed(() => {
        if (userStore.state.user.access.indexOf("root") !== -1) {
          return true
        }
        if (handlerState.group) {
          return userStore.state.user.access.indexOf(`${handlerState.module}-${handlerState.group}-add`) > -1
        } else {
          return userStore.state.user.access.indexOf(`${handlerState.module}-add`) > -1
        }
      })
    })

    function createAndNavigate() {
      for (let url of state.urls) {
        let new_route = router.resolve(url)
        dbStore.addOpened(new_route, handlerState["module"], handlerState["view"])
      }
    }

</script>

<style scoped></style>
