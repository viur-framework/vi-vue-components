<template>
    ACCESS {{ state.moduleActions }}
    <sl-button-group v-for="mod in state.moduleActions">
      <sl-button v-for="right in mod" :title="right['name']">
        <sl-icon :name="right['icon']" slot="prefix"></sl-icon>
      </sl-button>
    </sl-button-group>


    <sl-select :disabled="boneState.readonly" :value="value?.toString()" @sl-change="changeEvent" :multiple="boneState['bonestructure']['multiple']">
      <sl-option :value="value[0]" v-for="value in boneState['bonestructure']['values']">
          {{ value[1] }}
      </sl-option>
    </sl-select>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, onMounted, inject,computed} from 'vue'

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
          moduleActions:computed(()=>{
            let mods = {}
            for (const [k, v] of boneState['bonestructure']['values']){
              let parts = k.split("-")
              let name = parts[parts.length-1]
              let icon = "eye"
              if(name==="edit"){
                icon = "pencil"
              }else if (name === "delete"){
                icon = "trash"
              }else if (name === "manage"){
                icon = "gear"
              }else if (name === "add"){
                icon = "plus"
              }



              let element = {"key":k,"icon":icon,"name":name}
              if (Object.keys(mods).includes(parts[0])){
                mods[parts[0]].push(element)
              }else{
                mods[parts[0]] = [element]
              }

            }
            return mods
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
    sl-button-group{
      display: block;
    }
</style>
