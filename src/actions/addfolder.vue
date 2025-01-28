<template>
  <sl-button
    size="small"
    variant="success"
    :disabled="!state.canAdd"
    :title="$t('actions.addfolder')"
    @click="openAction($event)"
  >
    <sl-icon
      slot="prefix"
      :name="itemMeta(null, 'node').icon"
    ></sl-icon>
    {{ itemMeta(null, "node").name }} {{ $t("actions.add") }}
  </sl-button>

  <sl-dialog
    v-if="state.opened"
    :open="state.opened"
    :label="$t('actions.addfolder')"
    @sl-request-close="closeAction($event)"
  >
    <sl-input
      v-model="state.foldername"
      autofocus
      placeholder="name"
    ></sl-input>
    {{ state.foldername }}
    <sl-button
      slot="footer"
      variant="success"
      :loading="state.loading"
      @click="createNode($event)"
      >{{ $t("create") }}</sl-button
    >
    <sl-button
      slot="footer"
      variant="danger"
      outline
      @click="closeAction($event)"
      >{{ $t("abort") }}</sl-button
    >
  </sl-dialog>
</template>

<script setup>
import { reactive, defineComponent, inject, computed } from "vue"
import { useDBStore } from "../stores/db"
import { useUserStore } from "@viur/vue-utils/login/stores/user"
import { useRoute } from "vue-router"
import { Request } from "@viur/vue-utils"
import { useMessageStore } from "../stores/message"

    const handlerState = inject("handlerState")
    const tableReload = inject("reloadAction")
    const itemMeta = inject("itemMeta")
    const messageStore = useMessageStore()
    const dbStore = useDBStore()
    const userStore = useUserStore()
    const route = useRoute()

    const state = reactive({
      canAdd: computed(() => {
        if (userStore.state.user.access.indexOf("root") !== -1) {
          return true
        }
        return userStore.state.user.access.indexOf(`${handlerState.module}-add`) > -1
      }),
      opened: false,
      foldername: "",
      loading: false
    })

    function closeAction(e) {
      state.opened = false
    }
    function openAction(e) {
      state.opened = true
    }
    function createNode(e) {
      state.loading = true

      let targetnode = handlerState.currentPath.slice(-1)[0]?.["key"]

      Request.add(handlerState.module, {
        dataObj: {
          name: state.foldername,
          skelType: "node",
          node: targetnode
        }
      }).then(() => {
        state.opened = false
        state.loading = false
        tableReload(true)
        messageStore.addMessage("success", `Folder`, "Entry created")
      })
    }
</script>

<style scoped></style>
