<template>
  <sl-button
    v-if="true || state.canHandle"
    :disabled="!state.active"
    variant="success"
    size="small"
    :title="$t('actions.resave.text')"
    style="margin-left: 5px"
    outline
    @click="openDeletePopup"
  >
    <sl-icon slot="prefix" name="check-all"></sl-icon>
  </sl-button>

  <teleport v-if="state.opened" to="#dialogs" :disabled="!state.opened">
    <sl-dialog
      id="dialog-delete"
      :open="state.opened"
      :label="$t('actions.delete.text')"
      @sl-after-hide="state.opened = false"
    >
      {{ $t("actions.resave.msg", { n: 1 }) }}
      <!--TODO Translate-->
      <sl-button slot="footer" variant="primary" :title="$t('actions.resave.text')" @click="resaveEntries">
        {{ $t("actions.resave.text") }}
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
const currentlist = inject("currentlist")
const messageStore = useMessageStore()
const dbStore = useDBStore()
const userStore = useUserStore()
const route = useRoute()
const state = reactive({
  canHandle: computed(() => {
    if (handlerState.conf?.["bonelist"]) return false //if table is not complete disable this action

    if (userStore.state.user.access.indexOf("root") !== -1) {
      return true
    }
    if (handlerState.group) {
      return userStore.state.user.access.indexOf(`${handlerState.module}-${handlerState.group}-manage`) > -1
    } else {
      return userStore.state.user.access.indexOf(`${handlerState.module}-manage`) > -1
    }
  }),
  opened: false,
  active: computed(() => {
    return handlerState.currentSelection && handlerState.currentSelection.length > 0
  }),
  count: computed(() => {
    if (handlerState.currentSelection) {
      return handlerState.currentSelection.length
    }
    return 0
  }),
})

async function resaveEntries() {
  state.opened = false
  let wasSuccess = true

  for (const entry of handlerState.currentSelection) {
    let url = `/vi/${handlerState.module}/edit`
    const formData = new FormData()

    for (const bone of Request.skelDataToFormData(entry, currentlist.structure)) {
      for (const [k, v] of Object.entries(bone)) {
        let val = v
        if ([undefined, null].includes(v)) {
          val = ""
        }
        formData.append(k, val)
      }
    }

    let data = {}
    for (const key of formData.keys()) {
      data[[key]] = formData.getAll(key)
    }

    if (handlerState.type === "hierarchyhandler" || handlerState.type === "treehandler") {
      data["skelType"] = handlerState?.currentSelectionType
    }

    await Request.securePost(url, { dataObj: data })
      .then(async (resp) => {
        if (resp.status !== 200) {
          const errorData = await resp.json()
          if (errorData.descr && errorData.reason) {
            messageStore.addMessage("error", errorData.reason, errorData.descr)
          } else {
            messageStore.addMessage("error", `Error on Resave`, "Error on Resave")
          }
          wasSuccess = false
          return 0
        }
      })
      .catch(async (error) => {
        wasSuccess = false
        const errorData = await error.response.json()
        console.error(error)
        state.loading = false
        if (errorData.descr && errorData.reason) {
          messageStore.addMessage("error", errorData.reason, errorData.descr)
        } else {
          messageStore.addMessage("error", `Error on Resave`, "Error on Resave")
        }
      })
  }
  if (wasSuccess) {
    messageStore.addMessage("success", `Resave`, "Entries successfully saved")
  }
  if (handlerState.type === "treehandler" && handlerState.currentSelectionType === "leaf") {
    tableReload(true)
  } else {
    tableReload()
  }
}

function openDeletePopup() {
  state.opened = true
}
</script>
