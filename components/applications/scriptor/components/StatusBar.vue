<template>
  <sl-bar>
    <div slot="left" class="bar--left">
      <sl-icon name="file-earmark-code-fill"></sl-icon>
      Scriptor || filename
    </div>

    <div slot="center">
      --- PROGRESSBAR ---
    </div>


    <div slot="right">
      <sl-badge
                :variant="state.userStatus['variant']" pill
                :title="state.userStatus['text']"
                :pulse="state.userStatus['pulse']"
                @click="reset"
      >

        <span v-if="scriptorStore.state.isReady">&nbsp;&nbsp;</span>
        <span v-else>&nbsp;&nbsp;</span>

      </sl-badge>
      <sl-button size="small" variant="success" @click="executeScript" outline>
        Ausführen

      </sl-button>
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

function reset(){
  scriptorStore.state.instances[props.id].messages = []
  scriptorStore.state.instances[props.id].internalMessages = []
  scriptorStore.state.isReady=false
}


</script>

<style scoped>
sl-bar{
  min-height:50px;
  padding: 10px;
  border-bottom:1px solid var(--sl-color-neutral-400);

  & .bar--left{
    display:flex;
    gap: 10px;
    align-items: center;
    justify-content: center;
    flex-wrap: nowrap;

    & sl-icon{
      width:1.2em;
      height: 1.2em;
    }
  }

}
sl-badge{
  margin-right:5px;
}
</style>
