<template>
  <sl-alert open :variant="state.variant">
    {{ state.message }}
  </sl-alert>
</template>

<script setup>
  import {reactive, computed} from 'vue'
  const props = defineProps({
    entry:{
      type:Object
    }
  })

  const state = reactive({
    message:computed(()=>{
      if (props.entry["type"]==="install"){
        return props.entry["data"]["msg"]["msg"]
      }else{
        return props.entry["data"]["msg"]
      }
    }),
    variant:computed(()=>{
      if(["error", "fatal", "critical"].includes(props.entry["type"])) return "danger"
      if(["warning"].includes(props.entry["type"])) return "warning"
      if(["info","debug"].includes(props.entry["type"])) return "info"

      return "default"
    })
  })


</script>
