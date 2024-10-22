<template>
  <scriptor-runner
    :canAccess="state.canAccess"
    :current="state.current"
    :iconInfo="state.iconInfo"
    :active="state.active"
  >

  </scriptor-runner>
</template>

<script setup>
import { reactive, defineComponent, inject, computed } from "vue"
import { Request } from "@viur/vue-utils"
import { useMessageStore } from "../stores/message"
import { useRoute } from "vue-router"
import { useUserStore } from "@viur/vue-utils/login/stores/user"
import { useModulesStore } from "../stores/modules"
import { useAppStore } from "../stores/app"
import { useDBStore } from "../stores/db"
import Utils from "../utils"
import ScriptorRunner from "../extensions/scriptor/ScriptorRunner.vue"

const props = defineProps({
  name: {
    type: String,
    required: true
  }
})

const handlerState = inject("handlerState")
const tableReload = inject("reloadAction")
const messageStore = useMessageStore()
const modulesStore = useModulesStore()
const appStore = useAppStore()
const userStore = useUserStore()
const dbStore = useDBStore()
const route = useRoute()
const state = reactive({
  active: computed(() => {
    if (state.current["rel"]["capable"] === "none") {
      return true
    }
    return handlerState.currentSelection && handlerState.currentSelection.length > 0
  }),
  scriptKey: computed(() => {
    return props.name.replace("scriptor_", "")
  }),
  current: computed(() => {
    let currentConfig = modulesStore.state.modules[handlerState.module]["scripts"].filter(
      (x) => x["dest"]["key"] === state.scriptKey
    )
    return currentConfig[0]
  }),
  canAccess: computed(() => {
    if (userStore.state.user.access.indexOf("root") !== -1) {
      return true
    }

    let scriptAccess = false
    if (!state.current["dest"]["access"]) {
      scriptAccess = true
    } else {
      scriptAccess =
        userStore.userAccess.filter((x) => state.current["dest"]["access"].includes(x)).length ===
        state.current["dest"]["access"].length
    }

    if (!scriptAccess) return false

    let actionAccess = false
    if (!state.current["rel"]["access"]) {
      actionAccess = true
    } else {
      actionAccess =
        userStore.userAccess.filter((x) => state.current["rel"]["access"].includes(x)).length ===
        state.current["rel"]["access"].length
    }
    return actionAccess
  }),
  opened: false,
  url: computed(() => {
    let url = `/db/scriptor/frame/${state.scriptKey}`

    if (handlerState.currentSelection) {
      let params = Object.fromEntries(
        handlerState.currentSelection.map((i, idx) => [`key${idx === 0 ? "" : idx}`, i["key"]])
      )
      url += "?" + new URLSearchParams(params).toString()
    }

    return url
  }),
  iconInfo: computed(() => {
    const [icon, iconType, iconname, library] = Utils.iconNormalization(state.current["rel"]?.["icon"])
    return [library, iconname]
  })
})

function ScriptorUrl() {
  let url = `${import.meta.env.VITE_API_URL}${appStore.state["admin.scriptor.url"]}#/runner/${state.scriptKey}`
  if (handlerState.currentSelection) {
    let params = Object.fromEntries(
      handlerState.currentSelection.map((i, idx) => [`key${idx === 0 ? "" : idx}`, i["key"]])
    )
    url += `?scriptor_params=${JSON.stringify(params)}`
  }
  return url
}

function createAndNavigate(route) {
  window.open(ScriptorUrl(), "_blank").focus()

  //dbStore.addOpened(route, handlerState["module"], handlerState["view"]) //, "", "", "", true, false, true
}


</script>

<style scoped></style>
