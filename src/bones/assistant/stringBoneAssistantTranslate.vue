<template>
  <sl-input
    class="widget-bone widget-bone-string widget-bone-string-default"
    :class="([`widget-bone-string-${name}`])"
    :name="name"
    ref="stringBone"
    :disabled="boneState.readonly"
    :value="Utils.unescape(value)"
    :required="boneState.bonestructure.required && !boneState.bonestructure.multiple  && !boneState.bonestructure.languages"
    @sl-change="changeEvent"
    @keyup="changeEvent"
    :placeholder="boneState.label==='placeholder'?boneState?.bonestructure?.descr:undefined"
    :data-user-invalid="boneState.errorMessages.length===0?null:true"
    :pattern="state.pattern"
    :maxlength="boneState.maxlength"
    :minlength="boneState.minlength"
  >
    <sl-button :disabled="state.disabled" slot="suffix" size="small" variant="info" outline @click="state.opened=true">{{$t('actions.translate')}}</sl-button>
  </sl-input>

  <assistant-window
    :open="state.opened"
    :name="boneState.bonestructure['descr']"
    :tab-id="handlerState.tabId"
    :module="boneState?.bonestructure['module']"
    assistant="translate"
    :params="{name,value,index, lang, bone,boneState}"
    @close="closeAssistant"
    @next="nextAssistant"
  >
  </assistant-window>

</template>

<script setup>
import { reactive, onMounted, inject, computed, watchEffect, ref } from "vue"
import { useTimeoutFn } from "@vueuse/core"
import Utils from "@viur/vue-utils/bones/utils"
import assistantWindow from '../components/assistantWindow.vue'


  defineOptions({
    inheritAttrs: false
  })
  const props = defineProps( {
    name: String,
    value: [Object, String, Number, Boolean, Array],
    index: Number,
    lang: String,
    bone:Object,
    autofocus: Boolean
  })

  const emit = defineEmits( ["change"])

    const boneState = inject("boneState")
    const handlerState = inject("handlerState")
    const state = reactive({
      value: computed(() => props.value),
      valid: null,
      pattern: computed(() => {
        let pat = boneState.params?.pattern
        if (!pat) return undefined

        if (typeof(pat) === "String"){
          return pat
        }
        return pat?.[boneState.defaultLanguage]
      }),
      pattern_error:computed(()=>{
        let pat = boneState.params?.pattern_error
        if (!pat) return ''

        if (typeof(pat) === "String"){
          return pat
        }
        return pat?.[boneState.defaultLanguage]?pat?.[boneState.defaultLanguage]:''
      }),
      opened:false,
      disabled:computed(()=>!boneState.bonevalue?.['de'])
    })

    const stringBone = ref(null)

    function changeEvent(event) {
      let valid = stringBone.value.reportValidity()
      console.log(valid)
      let validStates = stringBone.value.validity
      if(validStates['patternMismatch']){
        stringBone.value.setCustomValidity(state.pattern_error)
      }else{
        stringBone.value.setCustomValidity('')
      }
      emit("change", props.name, event.target.value, props.lang, props.index, valid)
    }

    watchEffect(() => {
      if (props.autofocus) {
        if (stringBone.value && stringBone.value !== null && stringBone !== null) {
          const { start } = useTimeoutFn(() => {
            stringBone.value.focus()
          }, 600)

          start()
        }
      }
    })

    onMounted(() => {
      emit("change", props.name, props.value, props.lang, props.index) //init
    })
    function closeAssistant(val,lang){
      state.opened=false
      if(val){
        emit("change", props.name, val, lang, props.index)
      }
    }
    function nextAssistant(val,lang){
      if(val){
        emit("change", props.name, val, lang, props.index)
      }
    }

</script>

<style scoped>
sl-input {
  width: 100%;

  &::part(base) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  @media (max-width: 900px) {
    &::part(base) {
      border-top-right-radius: 0;
      border-bottom-left-radius: var(--sl-border-radius-medium);
    }
  }
}
</style>
