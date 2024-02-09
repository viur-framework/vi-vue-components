<template>
  <router-link
    v-slot="{ route }"
    :to="state.url"
    custom
  >
    <sl-button
      size="small"
      variant="success"
      outline
      :disabled="!state.canAdd"
      :title="$t('actions.addnode')"
      @click="createAndNavigate(route)"
    >
      <sl-icon
        slot="prefix"
        name="folder-plus"
      ></sl-icon>
      {{ $t("actions.addnode") }}
    </sl-button>
  </router-link>
</template>

<script lang="ts">
// @ts-nocheck
import { reactive, defineComponent, inject, computed } from "vue"
import { useDBStore } from "../stores/db"
import { useUserStore } from "../stores/user"
import { useRoute } from "vue-router"

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const handlerState: any = inject("handlerState")
    const dbStore = useDBStore()
    const userStore = useUserStore()
    const route = useRoute()

    const state = reactive({
      url: computed(() => {
        if (handlerState && handlerState["currentSelection"] && handlerState["currentSelection"][0]) {
          return `/db/${handlerState.module}/add/node/${handlerState["currentSelection"][0]["key"]}`
        }
        if (handlerState && handlerState["currentRootNode"]) {
          return `/db/${handlerState.module}/add/node/${handlerState["currentRootNode"]["key"]}`
        }
        return ""
      }),
      canAdd: computed(() => {
        if (userStore.state.user.access.indexOf("root") !== -1) {
          return true
        }
        return userStore.state.user.access.indexOf(`${handlerState.module}-add`) > -1
      })
    })

    function createAndNavigate(route: any) {
      dbStore.addOpened(route, handlerState["module"], handlerState["view"])
    }

    return {
      state,
      createAndNavigate
    }
  }
})
</script>

<style scoped></style>
