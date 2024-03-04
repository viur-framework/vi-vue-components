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

<script lang="ts">
// @ts-nocheck
import { reactive, defineComponent, inject, computed } from "vue"
import { useDBStore } from "../stores/db"
import { useUserStore } from "@viur/vue-utils/login/stores/user"
import { useRoute } from "vue-router"
import { Request } from "@viur/vue-utils"

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const handlerState: any = inject("handlerState")
    const tableReload: any = inject("reloadAction")
    const itemMeta: any = inject("itemMeta")
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
      Request.add(handlerState.module, {
        dataObj: {
          name: state.foldername,
          skelType: "node",
          node: handlerState.currentSelection
            ? handlerState.currentSelection[0]["key"]
            : handlerState.currentRootNode["key"]
        }
      }).then(() => {
        state.opened = false
        state.loading = false
        tableReload()
      })
    }

    return {
      state,
      openAction,
      closeAction,
      createNode,
      itemMeta
    }
  }
})
</script>

<style scoped></style>
