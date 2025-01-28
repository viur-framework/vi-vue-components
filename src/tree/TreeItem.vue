<template>
  <sl-tree-item
    :lazy="state.needsRequest"
    :name="name"
    :value="node"
    :selected="currentPath[currentPath.length - 1]?.['key'] === skelkey"
    :expanded="!state.needsRequest"
    @sl-lazy-load="fetchLayer"
    @dblclick.stop="enforceUpdate"
  >
    <sl-icon
      :name="state.currentMeta.icon"
      :library="state.currentMeta.library"
    >
    </sl-icon>
    <div class="name">
      {{Utils.renderValue(name) }}
    </div>
    <sl-tree-item v-if="!state.needsRequest && state.items.length === 0"
      ><span style="color: var(--sl-color-neutral-300); font-style: italic; font-size: 0.7em"
        >keine Einträge</span
      ></sl-tree-item
    >

    <tree-item
      v-for="i in state.items"
      :key="i['key']"
      :skelkey="i['key']"
      :name="i['name']"
      :node="i"
      :current-path="currentPath"
    >
    </tree-item>
  </sl-tree-item>
</template>

<script setup>
import { reactive, defineComponent, inject, onBeforeMount, watch, computed, onMounted, unref, toRaw } from "vue"
import { Request } from "@viur/vue-utils"
import useTree from "./tree.js"
import { isNavigationFailure } from "vue-router"
import Utils from "../utils.js"

  const props = defineProps({
    name: String,
    skelkey: String,
    node: Object,
    currentPath: {
      default: []
    },
    load: {
      default: false
    }
  })

    const handlerState = inject("handlerState")
    const itemMeta = inject("itemMeta")
    const state = reactive({
      items: [],
      needsRequest: true,
      currentMeta: computed(() => {
        return itemMeta(props.node, "node")
      }),
      name: computed(() => {
        if (typeof props.name === "object" && Object.keys(props.name).includes("de")){
          return props.name?props.name["de"]:props.name
        }
        return props.name
      })
    })

    watch(
      () => props.skelkey,
      (newVal, oldVal) => {
        if (newVal && props.load) {
          fetchLayer(null)
        }
      }
    )

    watch(
      () => props.currentPath.length,
      (newVal, oldVal) => {
        if (props.currentPath[props.currentPath.length - 2]?.["key"] === props.skelkey) {
          if (newVal > oldVal) {
            fetchLayer(null)
          }
        }
      }
    )

    onMounted(() => {
      if (props.load && props.skelkey) {
        fetchLayer(null)
      }
    })

    function fetchLayer(e) {
      Request.get(`/vi/${handlerState.module}/list`, {
        dataObj: {
          skelType: "node",
          orderby: "sortindex",
          limit: 99,
          parententry: props.skelkey
        },
        cached:true
      })
        .then(async (resp) => {
          let data = await resp.json()
          state.items = data.skellist
          state.needsRequest = false
        })
        .catch((error) => {
          state.needsRequest = true
        })
    }
    function enforceUpdate() {
      state.needsRequest = true
    }
</script>

<style scoped>
sl-tree-item {
  display: flex;
  max-width: 100%;
}

sl-icon{
  min-width: 1em;
}

.name{
  max-width: 100%;
  white-space: nowrap;
}
</style>
