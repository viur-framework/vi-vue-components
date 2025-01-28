<template>
  <sl-button
    variant="danger"
    size="small"
    :disabled="!state.active || !state.canDelete"
    :title="$t('actions.delete.text')"
    @click="openDeletePopup"
  >
    <sl-icon
      slot="prefix"
      name="trash-fill"
    ></sl-icon>
  </sl-button>

  <teleport
    v-if="state.opened"
    to="#dialogs"
    :disabled="!state.opened"
  >
    <sl-dialog
      id="dialog-delete"
      :open="state.opened"
      :label="$t('actions.delete.text')"
      @sl-after-hide="state.opened=false"
    >
      {{ $t("actions.delete.msg", { n: state.count })
      }}<!--TODO Translate-->
      <sl-button
        slot="footer"
        variant="primary"
        :title="$t('actions.delete.text')"
        @click="deleteEntries"
      >
        {{ $t("actions.delete.text") }}
      </sl-button>
    </sl-dialog>
  </teleport>
</template>

<script setup>
import { reactive, defineComponent, inject, computed } from "vue"
import { Request } from "@viur/vue-utils"
import { useMessageStore } from "../stores/message"
import { useDBStore } from "../stores/db"
import { useRoute } from "vue-router"
import { useUserStore } from "@viur/vue-utils/login/stores/user"

    const handlerState = inject("handlerState")
    const tableReload = inject("reloadAction")
    const messageStore = useMessageStore()
    const userStore = useUserStore()
    const route = useRoute()
    const state = reactive({
      active: computed(() => {
        return handlerState.currentSelection && handlerState.currentSelection.length > 0
      }),
      count: computed(() => {
        if (handlerState.currentSelection) {
          return handlerState.currentSelection.length
        }
        return 0
      }),
      canDelete: computed(() => {
        if (userStore.state.user.access.indexOf("root") !== -1) {
          return true
        }
        if (handlerState.group) {
          return userStore.state.user.access.indexOf(`${handlerState.module}-${handlerState.group}-delete`) > -1
        } else {
          return userStore.state.user.access.indexOf(`${handlerState.module}-delete`) > -1
        }
      }),
      opened: false
    })

    async function deleteEntries() {
      state.opened = false
      let deletionSuccess = true

      for (const entry of handlerState.currentSelection) {
        let url = `/vi/${handlerState.module}/delete`
        let dataObj = { key: entry.key }
        if (handlerState.type === "hierarchyhandler" || handlerState.type === "treehandler") {
          dataObj["skelType"] = handlerState?.currentSelectionType
        }

        await Request.securePost(url, { dataObj: dataObj }).then(async (resp) => {
          if (resp.status !== 200) {
            messageStore.addMessage("error", `Error on Save`, "Error on Save")
            deletionSuccess = false
            return 0
          }
        })
      }
      if (deletionSuccess) {
        messageStore.addMessage("success", `Delete`, "Entry deleted successfully")
      }
      if(handlerState.type ==="treehandler" && handlerState.currentSelectionType==="leaf"){
        tableReload(true)
      }else{
        tableReload()
      }


    }

    function openDeletePopup() {
      state.opened = true
    }
</script>

<style scoped></style>
