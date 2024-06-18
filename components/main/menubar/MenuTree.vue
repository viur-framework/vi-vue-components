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
      let ret = node['display'] !== 'hidden'

      if (!ret){
        return false
      }

      //hide empty moduleGroups
      if (!node?.['handlerComponent'] && node['children'].length===0){
        return false
      }

      let accessflag = `${node['module']}-view`
      if (node?.group){
        accessflag = `${node['module']}-${node['group']}-view`
      }

      if (node?.['handlerComponent'] && node["display"]!== "group" && !userStore.userAccess.includes('root') && !userStore.userAccess.includes(accessflag)){
        return false
      }
      return true
    }

    return { entryType, getIcon, getLibrary, getIconType,isVisible }
  }
})
</script>

<style scoped></style>
