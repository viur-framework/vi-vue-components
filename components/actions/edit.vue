<template>
  <sl-button
    size="small"
    variant="info"
    :disabled="!state.active || !state.canEdit"
    :title="$t('actions.edit')"
    @click="createAndNavigate()"
  >
    <sl-icon
      slot="prefix"
      name="pencil-fill"
    ></sl-icon>
  </sl-button>
</template>

<script lang="ts">
// @ts-nocheck
import { reactive, defineComponent, inject, computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useDBStore } from "../stores/db"
import { useUserStore } from "../stores/user"

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const handlerState: any = inject("handlerState")
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
            urls.push(`/db/${handlerState.module}/edit/node/${selection["key"]}`)
            continue
          }

          if (handlerState.type === "treehandler") {
            urls.push(`/db/${handlerState.module}/edit/${handlerState?.currentSelectionType}/${selection["key"]}`)
            continue
          }
          if (handlerState.group) {
            urls.push(`/db/${handlerState.module}/edit/${handlerState.group}/${selection["key"]}`)
          } else {
            urls.push(`/db/${handlerState.module}/edit/${selection["key"]}`)
          }
        }
        return urls
      }),
      canEdit: computed(() => {
        if (userStore.state.user.access.indexOf("root") !== -1) {
          return true
        }
        return userStore.state.user.access.indexOf(`${handlerState.module}-edit`) > -1
      })
    })

    function createAndNavigate() {
      for (let url of state.urls) {
        let new_route = router.resolve(url)
        dbStore.addOpened(new_route, handlerState["module"], handlerState["view"])
      }
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
