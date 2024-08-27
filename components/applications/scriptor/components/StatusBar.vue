<template>
  <sl-bar>
    <div slot="left">
      <sl-badge :variant="state.userStatus['variant']" pill
                :title="state.userStatus['text']"
                :pulse="state.userStatus['pulse']"
                @click="scriptorStore.state.isReady=false"
      >

        <span v-if="scriptorStore.state.isReady">&nbsp;&nbsp;</span>
        <span v-else>&nbsp;&nbsp;</span>

      </sl-badge>
    </div>

    <div slot="center">
      --- PROGRESSBAR ---
    </div>


    <div slot="right">
      <sl-button size="small" variant="success" @click="executeScript">Ausführen</sl-button>
    </div>
  </sl-bar>
</template>

<script setup>
import {reactive, computed} from "vue"
import {useScriptorStore} from "../store/scriptor"
const scriptorStore = useScriptorStore()

const props = defineProps({
  id:{
    required:true
  }
})

const state = reactive({
  userStatus:computed(()=>{
    if (scriptorStore.state.isReady && scriptorStore.state.isRunning){
      return {"text":"Skript läuft...","variant":"success","pulse":true}
    }else if ( !scriptorStore.state.isReady && scriptorStore.state.isRunning){
      return {"text":"Skriptor wird geladen...","variant":"warning","pulse":true}
    } else if ( scriptorStore.state.isReady && !scriptorStore.state.isRunning){
      return {"text":"Skriptor ist bereit.","variant":"success","pulse":false}
    }else{
      return {"text":"Skriptor nicht geladen.","variant":"danger","pulse":false}
    }
  }),
  scriptor:computed(()=>{
    return scriptorStore.state.instances[props.id]
  })
})

async function executeScript(){
  await scriptorStore.execute(state.scriptor.scriptCode, props.id).then(()=>{}) //then is needed to await
}

</script>

<style scoped>

</style>
