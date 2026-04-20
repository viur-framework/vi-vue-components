<template>
  <sl-button
    variant="success"
    size="small"
    :loading="state.loading"
    :title="$t(name)"
    :outline="name === 'actions.save_next' || name === 'actions.save_close'"
    @click="handleClick"
  >
    <sl-icon slot="prefix" :name="icon"></sl-icon>
    {{ $t(name) }}
  </sl-button>

  <teleport v-if="state.confirmOpen" :to="dialogTarget" :disabled="!state.confirmOpen">
    <sl-dialog :label="$t('actions.save_confirm.title')" open @sl-after-hide="state.confirmOpen = false">
      {{ $t("actions.save_confirm.text") }}
      <sl-button slot="footer" variant="default" :disabled="state.loading" @click="state.confirmOpen = false">
        {{ $t("abort") }}
      </sl-button>

      <sl-button slot="footer" variant="danger" :disabled="state.loading" @click="discardChanges">
        {{ $t("actions.save_confirm.discard") }}
      </sl-button>
      <sl-button slot="footer" variant="success" :loading="state.loading" @click="submitSave">
        {{ $t("actions.save_confirm.save") }}
      </sl-button>
    </sl-dialog>
  </teleport>
</template>

<script setup>
import { reactive, inject, computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useDBStore } from "../stores/db"
import { useAppStore } from "../stores/app"
import { useMessageStore } from "../stores/message"
import { useContextStore } from "../stores/context"
import { useTimeoutFn } from "@vueuse/core"

const props = defineProps({
  close: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    default: "actions.save",
  },
  icon: {
    type: String,
    default: "check",
  },
})

const handlerState = inject("handlerState")
const router = useRouter()
const route = useRoute()
const dbStore = useDBStore()
const contextStore = useContextStore()
const appStore = useAppStore()
const viform = inject("viform")
const reloadAction = inject("reloadAction")
const moduleConf = computed(() => dbStore.getConf(handlerState.module, handlerState.view))
const confirmOnSave = computed(() => Boolean(moduleConf.value?.["confirmOnSave"]) && props.name !== "actions.save_next")
const dialogTarget = computed(() => {
  return handlerState["tabId"] ? `#view_dialogs_${handlerState["tabId"]}` : "#dialogs"
})
const state = reactive({
  loading: false,
  confirmOpen: false,
})
const messageStore = useMessageStore()

function handleClick() {
  if (confirmOnSave.value) {
    state.confirmOpen = true
    return
  }

  submitSave()
}

async function discardChanges() {
  state.confirmOpen = false
  if (!reloadAction) return
  await reloadAction()
}

async function submitSave() {
  state.confirmOpen = false
  state.loading = true
  let url = ""
  let obj = contextStore.getContext(handlerState.tabId)
  if (
    appStore.state["core.version"] &&
    appStore.state["core.version"]?.[0] >= 3 &&
    appStore.state["core.version"]?.[1] >= 6
  ) {
    url = `/${handlerState.renderer}/${handlerState.module}/${handlerState.action}`
  } else {
    url = `/${handlerState.renderer}/${handlerState.module}/${
      handlerState.action === "clone" ? "add" : handlerState.action
    }`
  }

  if (handlerState.skeltype === "node" || handlerState.skeltype === "leaf") {
    url += `/${handlerState.skeltype}`

    if (handlerState.action === "clone") {
      obj["node"] = handlerState.skel["parententry"]
    } else {
      obj["node"] = handlerState.skelkey
    }
  }

  if (handlerState.group) {
    url += `/${handlerState.group}`
  }

  if (
    handlerState.action === "edit" ||
    (appStore.state["core.version"] &&
      appStore.state["core.version"]?.[0] >= 3 &&
      appStore.state["core.version"]?.[1] >= 6 &&
      handlerState.action === "clone")
  ) {
    url += `/${handlerState.skelkey}`
  }

  try {
    const resp = await viform.value.sendData(url, obj)
    const responsedata = await resp.json()

    if (resp.status !== 200) {
      if (responsedata.descr && responsedata.reason) {
        messageStore.addMessage("error", responsedata.reason, responsedata.descr)
      } else {
        messageStore.addMessage("error", `Error on Save`, "Error on Save")
      }
      return 0
    }

    if (handlerState.action === "edit") {
      if (responsedata["action"] === "edit" || responsedata["action"] === "clone") {
        //Something went wrong we must thorw (show) errors
      }
    }
    if (handlerState.action === "add" || handlerState.action === "clone") {
      if (responsedata["action"] === "add" || responsedata["action"] === "clone") {
        //Something went wrong we must thorw (show) errors
      } else {
        //messageStore.addMessage("success", `Add`, "Entry added successfully")
        dbStore.markHandlersToUpdate(handlerState.module, handlerState.group)
        if (props.name !== "actions.save_next") {
          dbStore.removeOpened(route)
          if (!props.close) {
            let new_route = router.resolve(`/db/${handlerState.module}/edit/${responsedata["values"]["key"]}`)
            if (handlerState.skeltype === "node") {
              new_route = router.resolve(`/db/${handlerState.module}/edit/node/${responsedata["values"]["key"]}`)
            } else if (handlerState.skeltype === "leaf") {
              new_route = router.resolve(`/db/${handlerState.module}/edit/leaf/${responsedata["values"]["key"]}`)
            } else if (handlerState.skel["listgroup"]) {
              new_route = router.resolve(
                `/db/${handlerState.module}/edit/${handlerState.skel["listgroup"]}/${responsedata["values"]["key"]}`
              )
            } else if (handlerState.group) {
              new_route = router.resolve(
                `/db/${handlerState.module}/edit/${handlerState.group}/${responsedata["values"]["key"]}`
              )
            }
            let currentview = null
            if (handlerState.group) {
              currentview = handlerState.group
            }

            const { start } = useTimeoutFn(() => {
              dbStore.addOpened(new_route, handlerState.module, currentview)
            }, 1)
            start()
          }
        }
      }
    }
    if (responsedata["action"] !== handlerState.action + "Success") {
      if (responsedata.descr && responsedata.reason) {
        messageStore.addMessage("error", responsedata.reason, responsedata.descr)
      } else {
        messageStore.addMessage("error", `Error on Save`, "Error on Save")
      }
    } else {
      if (handlerState.action === "add" || handlerState.action === "clone") {
        messageStore.addMessage("success", handlerState.action, "Eintrag erfolgreich erstellt")
      } else {
        messageStore.addMessage("success", handlerState.action, "Eintrag erfolgreich aktualisiert")
      }

      dbStore.markHandlersToUpdate(handlerState.module, handlerState.group)
      if (props.close) {
        dbStore.removeOpened(route)
      }
    }
  } catch (error) {
    state.loading = false
    if (typeof error !== "string" && error.response) {
      const errorData = await error.response.json()

      if (errorData.descr && errorData.reason) {
        messageStore.addMessage("error", errorData.reason, errorData.descr)
      } else {
        messageStore.addMessage("error", `Error on Save`, "Error on Save")
      }
    } else {
      messageStore.addMessage("error", `Error on Save`, "Error on Save")
    }
  } finally {
    state.loading = false
  }
}
</script>

<style scoped></style>
