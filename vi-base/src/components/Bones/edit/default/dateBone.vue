<template>
    <sl-input :disabled="boneState.readonly" :type="state.typeString" :value="state.value" @sl-change="changeEvent"></sl-input>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, onMounted, computed, inject} from 'vue'

export default defineComponent({
    props:{
        name:String,
        value:Object,
        index:Number,
        lang:String
    },
    components: {},
    emits:["change"],
    setup(props, context) {
      const boneState = inject("boneState")
      const state = reactive({
        value:computed(()=>{
          // remove timezone data if timed
          let boneValue = props.value
          if (boneState.bonestructure["time"]) {
            boneValue = props.value?.split('+')[0];
          } else if (props.value) {
            //convert to readable value
            boneValue = (new Date(props.value)).toISOString().substr(0, 10);
          }

          return boneValue
        }),
        typeString:computed(()=>{
          // Calculate the correct datetype String
          let typeString = "datetime-local"
          if (!boneState.bonestructure["time"]) {
            typeString = "date"
          }
          return typeString
        })
      })

      function changeEvent(event){
          context.emit("change",props.name,event.target.value,props.lang,props.index)
      }

      onMounted(()=>{
          context.emit("change",props.name,props.value,props.lang,props.index) //init
      })

      return {
          state,
          boneState,
          changeEvent
      }
    }
})
</script>

<style scoped lang="less">
    sl-input{
        width:100%;
    }
</style>
