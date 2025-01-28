<template>
  <router-link
    v-slot="{ route }"
    :to="state.url"
    custom
  >
    <sl-button
      size="small"
      variant="success"
      :disabled="!state.canAdd"
      :title="$t('actions.addleaf')"
      @click="createAndNavigate(route)"
    >
      <sl-icon
        slot="prefix"
        :name="itemMeta(null, 'leaf').icon"
        :library="itemMeta(null, 'leaf').library"
      ></sl-icon>
      {{ itemMeta(null, "leaf").name }} {{ $t("actions.add") }}
    </sl-button>
  </router-link>
</template>

<script setup>
import { reactive, defineComponent, inject, computed } from "vue"
import { useDBStore } from "../stores/db"
import { useUserStore } from "@viur/vue-utils/login/stores/user"
import { useRoute } from "vue-router"


    const handlerState = inject("handlerState")
    const itemMeta = inject("itemMeta")
    const dbStore = useDBStore()
    const userStore = useUserStore()
    const route = useRoute()

    const state = reactive({
      url: computed(() => {
        if (handlerState && handlerState["currentSelection"] && handlerState["currentSelection"][0]) {
          return `/db/${handlerState.module}/add/leaf/${handlerState["currentSelection"][0]["key"]}`
        }
        if (handlerState && handlerState["currentRootNode"]) {
          return `/db/${handlerState.module}/add/leaf/${handlerState["currentRootNode"]["key"]}`
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

    function createAndNavigate(route) {
      dbStore.addOpened(route, handlerState["module"], handlerState["view"])
    }
</script>

<style scoped></style>
