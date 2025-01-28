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

<script setup>
import { reactive, defineComponent, inject, computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useDBStore } from "../stores/db"
import { useUserStore } from "@viur/vue-utils/login/stores/user"
import Utils from '../utils'


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
        let entries = []
        if (!state.active) return entries

        for (let selection of handlerState.currentSelection) {
          let entry = {name:Utils.extractNamefromSkel(selection), url:""}

          if (handlerState.type === "hierarchyhandler") {
            entry['url'] = `/db/${handlerState.module}/edit/node/${selection["key"]}`
            continue
          }

          if (handlerState.type === "treehandler") {
            entry['url'] = `/db/${handlerState.module}/edit/${handlerState?.currentSelectionType}/${selection["key"]}`
            continue
          }
          if (handlerState.group) {
            entry['url'] = `/db/${handlerState.module}/edit/${selection["listgroup"]}/${selection["key"]}`
          } else {
            entry['url'] = `/db/${handlerState.module}/edit/${selection["key"]}`
          }
          entries.push(entry)
        }
        return entries
      }),
      canEdit: computed(() => {
        if (userStore.state.user.access.indexOf("root") !== -1) {
          return true
        }
        if (handlerState.group) {
          return userStore.state.user.access.indexOf(`${handlerState.module}-${handlerState.group}-edit`) > -1
        } else {
          return userStore.state.user.access.indexOf(`${handlerState.module}-edit`) > -1
        }
      })
    })

    function createAndNavigate() {
      for (let entry of state.urls) {
        let new_route = router.resolve(entry['url'])
        dbStore.addOpened(new_route, handlerState["module"], handlerState["view"], entry['name'])
      }
    }

</script>

<style scoped></style>
