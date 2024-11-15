<template>
  <template
    v-for="x in tree"
    :key="x"
  >
    <component
      :is="entryType(x)"
      v-if="isVisible(x)"
      :icon="getIcon(x)"
      :library="getLibrary(x)"
      :icon-type="getIconType(x)"
      :name="x['name']"
      :layer="layer"
      :to="x['url']"
      :closed="x['parententry'] !== x['parentrepo']"
      :module-info="x"
    >
      <menu-tree
        v-if="Object.keys(x).includes('children') && x['children'].length > 0 && x['display'] !== 'hidden'"
        :tree="x['children']"
        :layer="layer + 1"
      ></menu-tree>
    </component>
  </template>
</template>

<script lang="ts">
import TheMenubarItem from "./TheMenubarItem.vue"
import TheMenubarGroup from "./TheMenubarGroup.vue"
import { defineComponent, computed } from "vue"
import { ModuleInfo } from "../../stores/db"
import {useUserStore} from "@viur/vue-utils/login/stores/user"
import { useDBStore } from "../../stores/db"
import Utils from "../../utils"


export default defineComponent({
  components: { TheMenubarGroup, TheMenubarItem },
  props: {
    tree: {
      type: Array<ModuleInfo>
    },
    layer: {
      type: Number,
      default: 0
    }
  },
  setup(props, context) {
    const userStore = useUserStore()
    const dbStore = useDBStore()

    function entryType(node: ModuleInfo) {
      if (node["parententry"] === node["parentrepo"]) {
        return TheMenubarGroup
      }
      return TheMenubarItem
    }

    function getIcon(node: ModuleInfo) {
      if (!node["icon"]) {
        return undefined
      }
      if (node["icon"].includes("___")) {
        return node["icon"].split("___")[1]
      }
      return node["icon"]
    }

    function getLibrary(node: ModuleInfo) {
      if (!node["icon"]) {
        return undefined
      }
      return node["icon"].split("___")[0]
    }

    function getIconType(node: ModuleInfo) {
      if (!node["iconType"]) {
        return undefined
      }
      return node["iconType"]
    }

    function isVisible(node: ModuleInfo){
      if (node['display'] === 'hidden') return false
      if (Object.keys(node).includes("hasAccess")){
        return node['hasAccess']
      }
      return true
    }

    return { entryType, getIcon, getLibrary, getIconType,isVisible }
  }
})
</script>

<style scoped></style>
