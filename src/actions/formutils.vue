<template>
    <sl-button-group>
        <sl-button
        size="small"
        :title=" state.collapsed?'Einklappen': 'Ausklappen'"
        @click="handleClick"
        >
        <sl-icon
            slot="prefix"
            :name="state.collapsed?'arrows-collapse':'arrows-expand'"
        ></sl-icon>
        </sl-button>
    </sl-button-group>
  </template>
  
  <script setup>
  import { reactive, defineComponent, inject, computed } from "vue"
  import { useRoute, useRouter } from "vue-router"
  import { useDBStore } from "../stores/db"
  import { Request } from "@viur/vue-utils"
  import { useMessageStore } from "../stores/message"
  
    const props = defineProps( {

    })
  
      const handlerState = inject("handlerState")
      const reloadAction = inject("reloadAction")
      const viform = inject("viform")
      const router = useRouter()
      const route = useRoute()
      const dbStore = useDBStore()
      const state = reactive({
        loading: false,
        collapsed:true
      })
      const messageStore = useMessageStore()
  
      function handleClick() {
        for(const [cat,conf] of Object.entries(viform.value.state.categories)){
            conf["open"] = !state.collapsed
        }
        state.collapsed = !state.collapsed
      }
  </script>
  
  <style scoped></style>
  