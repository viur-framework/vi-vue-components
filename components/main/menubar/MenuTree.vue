<template>
  <template
    v-for="x in tree"
    :key="x"
  >
    <component
      :is="entryType(x)"
      v-if="x['display'] !== 'hidden'"
      :icon="getIcon(x)"
      :library="getLibrary(x)"
      :name="x['name']"
      :layer="layer"
      :to="x['url']"
      :closed="x['parententry'] !== x['parentrepo']"
      :moduleInfo="x"
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
import { defineComponent } from "vue"
import { ModuleInfo } from "../../stores/db"

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
      return node["icon"].split("___")[1]
    }

    function getLibrary(node: ModuleInfo) {
      if (!node["icon"]) {
        return undefined
      }
      return node["icon"].split("___")[0]
    }

    return { entryType, getIcon, getLibrary }
  }
})
</script>

<style scoped></style>
