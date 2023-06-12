<template>
    <sl-input clearable @sl-input="state.filter = $event.target.value">
      <sl-icon name="funnel" slot="suffix"></sl-icon>
    </sl-input>

    <template v-for="(mod,modname) in state.moduleActions['flags']">
      <sl-button-group v-if="modname.includes(state.filter)">
        <span>{{modname}}</span>
        <sl-button v-for="right in mod"
                  :title="right['name']"
                  :disabled="boneState.readonly"
                  @click="toggleAccessRight(right['key'])"
                  :variant="state.values.includes(right['key'])?'success':'default'"
                  >
          <sl-icon :name="right['icon']" slot="prefix"></sl-icon>
        </sl-button>
      </sl-button-group>
    </template>

    <template v-for="(mod,modname) in state.moduleActions['modules']">
      <sl-button-group v-if="modname.includes(state.filter)">
        <span>{{ dbStore.getConf(modname)?.name }}</span>
        <sl-button v-for="right in mod"
                  :title="right['name']"
                  :disabled="boneState.readonly"
                  @click="toggleAccessRight(right['key'])"
                  :variant="state.values.includes(right['key'])?'success':'default'"
                  >
          <sl-icon :name="right['icon']" slot="prefix"></sl-icon>
        </sl-button>
      </sl-button-group>
    </template>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, onMounted, inject,computed} from 'vue'
import {useDBStore} from "../../stores/db";


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
      const dbStore = useDBStore();
        const state = reactive({
          moduleActions:computed(()=>{
            const actionmap = {"add":2, "view":0,"edit":1,"delete":3,"manage":4}
            let mods = {"flags":{}, "modules":{}}
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

              //if (parts[0].startsWith("_")) continue

              let element = {"key":k,"icon":icon,"name":name, "module":parts[0]}
              if (Object.keys(mods['modules']).includes(parts[0])){
                mods['modules'][parts[0]] = {...mods['modules'][parts[0]], ...{[actionmap[name]]:element}}
              }else{
                if(!actionmap[name]){ //flags
                  element['icon'] = "check"
                  mods['flags'][parts[0]] = {[k]:element}
                }else{
                  mods['modules'][parts[0]] = {[actionmap[name]]:element}
                }
              }

            }

            return mods
        }),
        values:props.value,
        filter:""


        })

        onMounted(()=>{
            context.emit("change",props.name,props.value,props.lang,props.index) //init
        })

        function toggleAccessRight(key){
          if (state.values.includes(key)){
            state.values.splice(state.values.indexOf(key),1)
          }else{
            state.values.push(key)
          }
          context.emit("change",props.name,state.values,props.lang,props.index)
        }

        return {
            state,
            boneState,
            toggleAccessRight,
            dbStore
        }
    }
})
</script>

<style scoped lang="less">
    sl-button-group{
      display: block;
    }
</style>
