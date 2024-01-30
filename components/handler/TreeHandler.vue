<template>
  <handler-bar
    :module="module"
    handler="treehandler"
  ></handler-bar>
  <loader
    v-if="!state.currentRootNode"
    size="3"
  ></loader>
  <file-browser
    v-if="state.currentRootNode"
    :rootnode="state.currentRootNode"
    :module="module"
    :dragging="true"
    :params="contextStore.state.globalContext"
    @changed="onSelectionChanged"
  >
  </file-browser>
</template>

<script lang="ts">
//@ts-nocheck
import { reactive, defineComponent, computed, provide, onBeforeMount, watch, onActivated, onDeactivated } from "vue"
import HandlerBar from "../bars/HandlerBar.vue"
import { ListRequest } from "@viur/vue-utils"
import { useDBStore } from "../stores/db"
import { Request } from "@viur/vue-utils"
import FileBrowser from "../tree/FileBrowser.vue"
import { useMessageStore } from "../stores/message"
import { useUserStore } from "../stores/user"
import { useContextStore } from "../stores/context"
import Loader from "@viur/vue-utils/generic/Loader.vue"
import { useRoute } from "vue-router"

export default defineComponent({
  props: {
    module: {
      type: String,
      required: true
    },
    view: null,
    selector: false
  },
  emits: ["currentSelection"],
  components: { FileBrowser, HandlerBar, Loader },
  setup(props, context) {
    const dbStore = useDBStore()
    const userStore = useUserStore()
    const contextStore = useContextStore()
    const route = useRoute()

    const state = reactive({
      type: "treehandler",
      tabId: route.query?.["_"],
      currentRootNodes: [],
      currentRootNode: null,
      module: computed(() => props.module),
      group: null,
      view: computed(() => props.view),
      active: false,
      currentSelection: null,
      currentSelectionType: null,
      selector: computed(() => props.selector),
      selectedBones: [],
      selectedRows: []
    })
    provide("handlerState", state) // expose to components

    function fetchRoots() {
      let context = contextStore.getCurrentContext()
      if (Object.keys(context).includes("parentrepo")) {
        state.currentRootNode = { name: "Repo", key: context["parentrepo"] }
        state.currentRootNodes = [state.currentRootNode]
        return 0
      }

      return Request.get(`/vi/${props.module.replace(".","/")}/listRootNodes`)
        .then(async (resp) => {
          let data = await resp.json()
          state.currentRootNodes = data
          state.currentRootNode = data[0]
        })
        .catch((error) => {
          if (error.statusCode === 401) userStore.updateUser()
        })
    }

    function fetchInitData() {
      return fetchRoots()
    }

    function reloadAction() {
      state.currentRootNode = null
      return fetchRoots()
    }

    provide("reloadAction", reloadAction)

    function changerootNode(key: string) {
      state.currentRootNode = state.currentRootNodes.filter((i) => i["key"] === key)[0]
    }
    provide("changerootNode", changerootNode)

    onBeforeMount(() => {
      fetchInitData()
    })

    onActivated(() => {
      state.active = true

      let tabData = dbStore.getTabById(route.query["_"])

      if (tabData?.["update"]) {
        reloadAction()
        tabData["update"] = false
      }
    })

    onDeactivated(() => {
      state.active = false
    })

    function onSelectionChanged(selection, type) {
      if (selection) {
        state.currentSelection = [selection]
        state.currentSelectionType = type
      } else {
        state.currentSelection = null
        state.currentSelectionType = null
      }

      context.emit("currentSelection", state.currentSelection)
    }

    function setSelectedBones() {
      let bones = []
      for (const [k, v] of Object.entries(state.structure)) {
        if (v["visible"]) bones.push(k)
      }
      state.selectedBones = bones
    }

    return {
      state,
      onSelectionChanged,
      contextStore
    }
  }
})
</script>

<style scoped>
sl-split-panel {
  --min: 300px;
  --max: 40%;
  flex: 1;

  &::part(panel) {
    display: flex;
    flex-direction: column;
  }
}

sl-table {
  &::part(base) {
    margin-top: 0;
    border: none;
    border-radius: 0;
  }
}
</style>
