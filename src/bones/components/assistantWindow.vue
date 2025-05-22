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
      <div class="body-wrapper">
        <div style="display:flex;width:100%;justify-content: space-between;gap:10px;">
          <div style="width: 50%">Original(de):
            <sl-textarea :value="state.value_de">
            </sl-textarea>
          </div>

          <div style="width: 50%">Ziel({{state.currentLang}}):
            <sl-textarea :value="state.result || '-'" @sl-change="updateValue">
            </sl-textarea>
            <sl-button @click="translate" size="small" outline variant="success">Übersetzen</sl-button>
          </div>
        </div>
        <span style="font-size: var(--sl-font-size-small);font-style: italic;text-align: center">
          Bei der Übersetzung kommt Künstliche Intelligenz zum Einsatz, die Erebnisse können fehlerhaft sein. Bitte prüfen Sie stehts das Ergebnis.
        </span>
      </div>

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
        <sl-button variant="info" outline @click="nextlang" size="small":disabled="!state.nextlang">
          Übernehmen und nächste leere Sprache
        </sl-button>

        <sl-button
          variant="success"
          size="small"
          @click="relationApplySelection()"
        >
          Ziel für {{state.currentLang}} übernehmen
        </sl-button>
      </div>
    </sl-dialog>
  </teleport>
</template>

<script setup>

import {reactive, defineComponent, onMounted, inject, computed,watch} from "vue"
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

  const emit = defineEmits(["close",'next'])

    const state = reactive({
      result: null,
      currentLang:null,
      rawLang: computed(()=>state.currentLang?.split("_")[0]),
      simple: computed(()=>state.currentLang?.split("_")?.length===2),
      value_de:null,
      nextlang: computed(()=>{
        for (const [l,v] of Object.entries(props.params.boneState.bonevalue)){
          if (!v && state.currentLang!==l) {
            return l
          }
        }
        return null
      })
    })
    function translate(){
      Request.get("/json/assistant/translate",{dataObj:{
        text:state.value_de,
        language:state.rawLang,
        simplified:state.simple
      }})
    }

    onMounted(()=>{
      state.value_de = props.params.boneState.bonevalue['de']
      if(props.params.lang === "de"){
        state.currentLang = state.nextlang
      }else{
        state.currentLang = props.params.lang
      }
    })

    watch(()=>props.params.boneState.bonevalue['de'],(newVal,oldVal)=>{
      state.value_de = newVal
    })

    function updateValue(e){
      state.result = e.target.value
    }


    function nextlang(){
      emit("next", state.result, state.currentLang)
      state.currentLang = state.nextlang
    }


    function relationCloseAction() {
      state.result = null
      emit("close")
    }

    function relationApplySelection() {
      emit("close", state.result, state.currentLang)
    }
</script>

<style scoped>
.relation-popup {
  &::part(base) {
    position: absolute;
    height: 100%;
  }

  &::part(panel) {

    margin-bottom: 40px;
  }

  &::part(body) {
    display: contents;
    padding:20px;
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

.body-wrapper{
  padding:20px 20px 0 20px;
  display:flex;
  flex-direction: column;
  gap:20px;
}
</style>
