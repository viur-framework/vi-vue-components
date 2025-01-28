<template>
  <sl-button
    size="small"
    variant="warning"
    :disabled="!state.active || !state.canEdit"
    :loading="state.loading"
    :title="$t('actions.move')"
    @click="openAction"
  >
    <sl-icon
      slot="prefix"
      name="folder-symlink-fill"
    ></sl-icon>
  </sl-button>

  <sl-dialog
    v-if="state.opened"
    :open="state.opened"
    :label="$t('actions.move')"
    @sl-request-close="closeAction($event)"
  >
    <template v-if="state.selection"
      >{{ handlerState.currentSelection.length }} Einträge nach: {{ state.selection["name"] }} verschieben</template
    >
    <sl-tree @sl-selection-change="nodeSelection">
      <tree-item
        :name="handlerState.currentRootNode?.['name']"
        :skelkey="handlerState.currentRootNode?.['key']"
        :node="handlerState.currentRootNode"
        type="root"
      ></tree-item>
    </sl-tree>

    <sl-button
      slot="footer"
      variant="success"
      :loading="state.loading"
      @click="moveItems($event)"
      >{{ $t("actions.move") }}
    </sl-button>
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
import { reactive, defineComponent, inject, onBeforeMount, computed } from "vue"
import { useUserStore } from "@viur/vue-utils/login/stores/user"
import treeItem from "../tree/TreeItem.vue"
import { Request } from "@viur/vue-utils"

    const handlerState = inject("handlerState")
    const reloadAction = inject("reloadAction")
    const userStore = useUserStore()
    const state = reactive({
      active: computed(() => {
        return handlerState.currentSelection && handlerState.currentSelection.length > 0
      }),
      canEdit: computed(() => {
        if (userStore.state.user.access.indexOf("root") !== -1) {
          return true
        }
        return userStore.state.user.access.indexOf(`${handlerState.module}-edit`) > -1
      }),
      opened: false,
      selection: null,
      loading: false,
      total: 0,
      current: 0
    })
    function closeAction(e) {
      state.opened = false
    }
    function openAction(e) {
      state.opened = true
    }

    function nodeSelection(e) {
      console.log(e)
      state.selection = e.detail.selection[0]["value"]
    }

    function moveItems() {
      state.total = handlerState.currentSelection.length
      state.loading = true
      for (let item of handlerState.currentSelection) {
        Request.securePost(`/vi/${handlerState.module}/move`, {
          dataObj: {
            parentNode: state.selection["key"],
            key: item["key"],
            skelType: handlerState.currentSelectionType
          }
        })
          .then((resp) => {
            state.current += 1
            if (state.current === state.total) {
              state.total = 0
              state.current = 0
              state.loading = false
              closeAction()
              handlerState.selectedRows = []
              reloadAction()
            }
          })
          .catch(() => {
            state.total = 0
            state.current = 0
            state.loading = false
          })
      }
    }
</script>

<style scoped></style>
