<template>
  <sl-split-panel vertical style="height: 100%;--min:50px; --max:100% " position="50">
  <div slot="start">
    <status-bar :id="state.id" :filename="state.script?.name">
      <template #startRight>
        <sl-button size="small" variant="info" outline style="margin-right:10px;" @click="clearlog">{{$t('actions.clear_log')}}</sl-button>
      </template>
      <sl-button :loading="state.saving" size="small" variant="success" style="margin-left:10px;" @click="saveCode">{{$t('actions.save')}}</sl-button>
    </status-bar>
    <div class="wrapper-editor">
      <code-editor v-if="state.script" :id="state.id"></code-editor>
      <sl-spinner v-else></sl-spinner>
    </div>


  </div>
  <div slot="end" class="wrapper-widgets" ref="messagewrapper">
    <widget-list :id="state.id"></widget-list>
  </div>
</sl-split-panel>


</template>

<script setup>
import {reactive, onMounted, onBeforeMount, computed, watch, ref} from 'vue'
  import WidgetList from './components/WidgetList.vue';
  import StatusBar from './components/StatusBar.vue';
  import CodeEditor from './components/CodeEditor.vue';
  import {useScriptorStore} from "./store/scriptor"
  import {Request} from "@viur/vue-utils";
  import {useDebounceFn} from "@vueuse/core/index";
  import { useDBStore } from '../../stores/db';

  const dbStore = useDBStore()
const messagewrapper = ref(null)

  const props = defineProps({
    module:{type:String},
    skelkey : {type:String},
    skeltype: {type:String}
  })


  const scriptorStore = useScriptorStore()
  const state = reactive({
    id:null,
    scriptor:computed(()=>{
      return scriptorStore.state.instances[state.id]
    }),
    script:null,
    saving:false
  })

  onBeforeMount(()=>{
    state.id = scriptorStore.createNewInstance()
    loadCode()
  })

  function loadCode(){
    console.log(props)
    if (!props.skelkey){
      return
    }
    Request.edit(props.module, props.skelkey, {group:props.skeltype
      }).then(async (resp)=>{
      let data = await resp.json()
      state.script = data['values']

      state.scriptor.scriptCode = data["values"]['script'].replace(/\\n/g, "\n")
      state.scriptor.scriptKey = data["values"]['key']
    })

  }

  function saveCode(){
    state.saving = true
    Request.securePost(`/vi/${props.module}/edit/${props.skeltype}/${props.skelkey}`,{dataObj:{
      script: state.scriptor.scriptCode
    }}).then(async (resp)=>{
      let data = await resp.json()
      state.saving = false
    })
    let currentTab = dbStore.getActiveTab()
    currentTab["update"] = true

  }

  function clearlog(){
    state.scriptor.messages = []
  }

  watch(
    () => state.scriptor?.messages.length,
    (newVal, oldVal) => {
      if (messagewrapper.value){
        const scroller = useDebounceFn((event) => {
          messagewrapper.value.scrollTop = 999999
        }, 1)
        scroller()
      }

    }
  )

</script>
<style scoped>
.wrapper-editor{
  height: calc(100% - 50px);
  width:100%;
}

.wrapper-widgets{
  overflow-y: auto;
}

</style>
