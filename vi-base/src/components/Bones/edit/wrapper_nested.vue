<template>
  <sl-alert open variant="danger" v-if="!state.globalRegistration">
    In Order to use this Bone register the bone component globally in your main file
  </sl-alert>
  <div class="form" v-else>
    <template v-for="(data,name) in state.structure">
      <bone
          :is="getBoneWidget(data['type'])"
          :name="name"
          :structure="state.structure"
          :skel="state.value"
          :errors="boneState.errors"
          :readonly="boneState.bonestructure['readonly']?true:undefined"
          @change-internal="changeEvent"
        >

      </bone>
    </template>
  </div>
</template>

<script lang="ts">
import {reactive, defineComponent, onMounted, inject, computed,getCurrentInstance} from 'vue'
import {getBoneWidget} from "./index.ts"

export default defineComponent({
  props:{
        name:String,
        value:Object,
        index:Number,
        lang:String,
        readonly:Boolean,
        params:Object,
    },
    emits:["change"],
    setup(props, context) {
        const boneState = inject("boneState")
        const state = reactive({
          value:props.value,
          structure:computed(()=>{
            return structureToDict(boneState.bonestructure['using'])
          }),
          globalRegistration:false
        })

        function changeEvent(data){
            context.emit("change",data)
        }

        onMounted(()=>{
          let app = getCurrentInstance().appContext
          if(app.components.bone){
            state.globalRegistration=true
          }else{
            state.globalRegistration=false
          }
        })

        function updateValue(e){
          console.log(e)
        }

        function structureToDict(structure: object) {
          if (Array.isArray(structure)) {
              let struct = {};
              for (const idx in structure) {
                struct[structure[idx][0]] = structure[idx][1];
              }
              return struct;
            }else{
              return structure;
            }
        }

        return {
            state,
            boneState,
            getBoneWidget,
            structureToDict,
            changeEvent,
            updateValue
        }
    }
})
</script>

<style scoped>
.form{
  width:100%;
}

</style>
