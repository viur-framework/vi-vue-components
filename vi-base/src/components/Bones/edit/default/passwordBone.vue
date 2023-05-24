<template>
    <sl-input :disabled="boneState.readonly" type="password" clearable password-toggle="true" v-model="state.value1" @sl-change="changeEvent" @sl-clear="state.value1=''"  @keyup="changeEvent">
      <sl-icon :name="state.equal?'check':'x'" slot="suffix"></sl-icon>
    </sl-input>
    <sl-input v-if="!boneState.readonly" type="password" clearable password-toggle="true" v-model="state.value2" @sl-change="changeEvent" @sl-clear="state.value2=''"  @keyup="changeEvent">
      <sl-icon :name="state.equal?'check':'x'" slot="suffix"></sl-icon>
    </sl-input>
    <ul>
      <li v-for="error in state.passwordInfo">{{error}}</li>
    </ul>
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
          value1:"",
          value2:null,
          equal:false,
          passwordInfo:[]
        })

        function changeEvent(event){
            if (state.value1 === state.value2){
              state.equal = true
            }else{
              state.equal = false
            }
            testPassword(state.value1)
            context.emit("change",props.name,event.target.value,props.lang,props.index)
        }

        onMounted(()=>{
            context.emit("change",props.name,props.value,props.lang,props.index) //init
        })

        function testPassword(password: string):string [] {
          state.passwordInfo = []
          for (const test: [string, string] of boneState.bonestructure["tests"]) {
            if (!new RegExp(test[0]).test(password)) {
              state.passwordInfo.push(test[1]);
            }
          }
          if (!state.equal){
            state.passwordInfo.push("Die eingegebenen Passwörter stimmen nicht überein.");
          }
          if (!state.value1){
            state.passwordInfo.push("Das eingegebene Passwort ist leer.");
          }
        }


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
