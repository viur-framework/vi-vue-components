<template>
  {{ scriptorStore.state.instances }}

  <div class="widget-wrapper">
    <template v-if="state.scriptor?.hideInternalMessages && ['all','internal'].includes(type)">
      <component :is="getWidget(entry['type'])"
                 v-for="entry in state.scriptor?.internalMessages?.slice(-100)"
                 :key="entry.data['unique_id']"
                 :entry="entry">
      </component>
    </template>
    <template v-if="['all','script'].includes(type)">
      <component :is="getWidget(entry['type'])"
                 v-for="entry in state.scriptor?.messages?.slice(-100)"
                 :key="entry.data['unique_id']"
                 :entry="entry">
      </component>
    </template>
  </div>
</template>

<script setup>
import {reactive, computed} from 'vue'
import {useScriptorStore} from "../store/scriptor"
import { computedAsync } from '@vueuse/core'
import widgets from './widgets/index'

const scriptorStore = useScriptorStore()


const props = defineProps({
  type:{
    default:"all",
    validator(value, props){
      return ['script','internal','all'].includes(value)
    }
  },
  id:{
    required:true
  }
})

const state = reactive({
  scriptor:computed(()=>{
    return scriptorStore.state.instances[props.id]
  })
})

function getWidget(type){
  console.log(type)
  if (["install", "err", "stdout", "stderr", "log"].includes(type)){
    return widgets.logEntry
  } else if (["alert"].includes(type)){
    return widgets.alertEntry
  } else if (["select"].includes(type)){
    return widgets.selectEntry
  }

  return widgets.logEntry
}


</script>

<style scoped>
.widget-wrapper{
  display:flex;
  flex-direction: column;
  gap:10px;

}
</style>
