<template>
  <sl-tooltip v-if="appStore.state.debug" placement="bottom-end" :open="state.open" style="--max-width: 700px;" hoist trigger="manual">
    <sl-icon name="info-circle" @click="state.open =!state.open"></sl-icon>
    <div slot="content" style="display:flex; flex-direction:column; gap:10px;">
      <div v-if="Object.keys(contextStore.state.globalContext).length>0">
      <h2 style="font-weight:bold;font-size: 1rem">Globale Kontexte:</h2>
      <ul>
        <li v-for="(value, contextname) in contextStore.state.globalContext">
          <div style="display: flex; gap: 10px; align-items: center;">
            <div style="display:flex; flex-direction:column">
              <span style="font-weight: bold">{{contextname}}</span>
              <span>{{value}}</span>
            </div>
          </div>
        </li>
      </ul>
      </div>
      <div v-if="Object.keys(state.localContext).length>0">
      <h2 style="font-weight:bold;font-size: 1rem">Lokale Kontexte:</h2>
      <ul>
        <li v-for="(value, contextname) in state.localContext">
          <div style="display: flex; gap: 10px; align-items: center;">
            <div style="display:flex; flex-direction:column">
              <span style="font-weight: bold">{{contextname}}</span>
              <span>{{value}}</span>
            </div>
            <sl-button size="small" variant="danger" @click="deleteContext(contextname)">
              <sl-icon name="trash"></sl-icon>
            </sl-button>
          </div>

        </li>
      </ul>
      </div>
    </div>
  </sl-tooltip>
</template>

<script setup>
import { useAppStore } from "../../stores/app"
import { useDBStore } from "../../stores/db"
import {useContextStore} from "../../stores/context";
import { defineComponent, reactive, computed, inject } from "vue"
import router from "../../routes"

    const handlerState = inject("handlerState")
    const reloadAction = inject("reloadAction")
    const appStore = useAppStore()
    const dbStore = useDBStore()
    const contextStore = useContextStore()
    const state = reactive({
      open:false,
      localContext:computed(()=>{
        return contextStore.getLocalContext(handlerState.tabId)
      })

    })

    function deleteContext(contextname){
      delete contextStore.getLocalContext(handlerState.tabId)[contextname]
      reloadAction()
    }
</script>

<style scoped>
sl-tooltip::part(body){
  background-color:var(--sl-color-neutral-100);
  border: 1px solid var(--sl-color-primary-500);
  color:black;
  pointer-events: all;
}

sl-tooltip::part(base__arrow){
  background-color:var(--sl-color-neutral-100);
  border: 1px solid var(--sl-color-primary-500);
}

li{
  border: 1px solid var(--sl-color-primary-500);
  border-radius: 5px;
  padding: 5px;
  background-color:var(--sl-color-neutral-200);
  margin-bottom: 10px;
}

sl-icon:hover{
  cursor: pointer;
  color:var(--sl-color-primary-700);

}
</style>
