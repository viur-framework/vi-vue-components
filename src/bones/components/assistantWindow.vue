<template>
  <teleport
    v-if="open"
    :to="'#view_dialogs_' + tabId"
    :disabled="!open"
  >
    <sl-dialog
      open
      :label="'Assistant: '+ assistant +' - '+ name"
      class="relation-popup"
      style="--width: 85%"
      @sl-after-hide="relationCloseAction()"
    >
      <div style="display:flex;width:100%;justify-content: space-between;gap:10px;padding:20px;">
        <div style="width: 50%">Original(de):<br> {{params.boneState.bonevalue['de']}}</div>
        <div style="width: 50%">Ziel({{params.lang}}): <br>{{state.result || '-'}}</div>
      </div>

      <sl-button @click="translate">Anfragen</sl-button>


      <br><br><br><br>
      {{ params }}



      <div
        slot="footer"
        class="footer"
      >
        <sl-button
          variant="danger"
          size="small"
          outline
          @click="relationCloseAction()"
          >{{ $t("relation.abort") }}</sl-button
        >
        <sl-button
          variant="success"
          size="small"
          @click="relationApplySelection()"
        >
          {{ $t("relation.select") }}
        </sl-button>
      </div>
    </sl-dialog>
  </teleport>
</template>

<script setup>

import {reactive, defineComponent, onMounted, inject, computed} from "vue"
import { Request } from "@viur/vue-utils"
import handlers from "../../handler/handlers"

function currentHandler(name){
  return handlers?.[name]?handlers[name]:name
}

const props = defineProps({
    open: Boolean,
    name: String,
    module: String,
    tabId: String,
    assistant:String,
    params:Object
  })

  const emit = defineEmits(["close"])

    const state = reactive({
      result: null,
      rawLang: computed(()=>props.params.lang.split("_")[0]),
      simple: computed(()=>props.params.lang.split("_").length===2)
    })
    function translate(){
      Request.get("/json/assistant/translate",{dataObj:{
        text:props.params.boneState.bonevalue['de'],
        language:state.rawLang,
        simplified:state.simple
      }})
    }



    function relationCloseAction() {
      state.result = null
      emit("close")
    }

    function relationApplySelection() {
      emit("close", state.result)
    }
</script>

<style scoped>
.relation-popup {
  &::part(base) {
    position: absolute;
    height: 100%;
  }

  &::part(panel) {
    height: 100%;
    max-height: calc(100% - 100px);
    margin-bottom: 40px;
  }

  &::part(body) {
    display: contents;
  }

  &::part(footer) {
    padding: var(--sl-spacing-small);
  }

  &::part(overlay) {
    position: absolute;
  }

  &:deep(.bar sl-button[variant="success"]) {
    &::part(base) {
      background-color: transparent;
      border: 1px solid var(--sl-color-success-500);
      aspect-ratio: 1;
      padding: 0;
    }

    &::part(label) {
      display: none;
    }

    &::part(prefix) {
      color: var(--sl-color-success-500);
    }
  }
}

.footer {
  display: flex;
  justify-content: space-between;
}
</style>
