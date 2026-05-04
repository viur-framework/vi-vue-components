<template>
  <sl-button size="small" :title="$t('actions.overlay')" @click="openDrawer">
    <sl-icon slot="prefix" name="clipboard-data-fill"></sl-icon>
    {{ $t("actions.fluidpageoverlay") }}
  </sl-button>
</template>

<script setup>
import { reactive, defineComponent, inject, computed } from "vue"
import { useDBStore } from "../stores/db"
import { Request } from "@viur/vue-utils"
import { useRoute } from "vue-router"

const route = useRoute()
const handlerState = inject("handlerState")
const dbStore = useDBStore()
const state = reactive({
  active: computed(() => {
    return handlerState.currentSelection && handlerState.currentSelection.length > 0
  }),
})

async function openDrawer() {
  let data
  try{
    const req = await Request.view(route.params.parentmodule, route.params.key)
    data = await req.json()
    console.log(data)
  }catch(e){
    console.log(e)
  }

  dbStore.state["skeldrawer.entry"] = data['values']
  dbStore.state["skeldrawer.structure"] =  data['structure']
  dbStore.state["skeldrawer.opened"] = !dbStore.state["skeldrawer.opened"]
}
</script>

<style scoped></style>
