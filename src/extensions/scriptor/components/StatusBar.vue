<template>
  <sl-bar>
    <div
      slot="left"
      class="bar--left"
    >
      <sl-icon name="file-earmark-code-fill"></sl-icon>
      <template v-if="filename">
        {{ filename }}
      </template>
      <template v-else>
        Scriptor
      </template>
    </div>

    <div slot="center">
      <div v-if="scriptorStore.progress.max_step > -1">
        <sl-progress-bar
          class="scriptorprogressbar"
          :value="scriptorStore.progress.total"
          label="Upload progress"
        ></sl-progress-bar>
        <br />
        <div class="scriptorprogresstext">
          {{ scriptorStore.progress.step }}/{{ scriptorStore.progress.max_step }} ({{
            Math.floor(scriptorStore.progress.total)
          }}%)
          {{ scriptorStore.progress.txt }}
        </div>
      </div>
    </div>

    <div class="right" slot="right">

      <div class="status"
          :title="state.userStatus['text']">
        <sl-badge
          :variant="state.userStatus['variant']"
          pill
          :pulse="state.userStatus['pulse']"
          @click="reset"
        >
        </sl-badge>

        {{ state.userStatus['text'] }}
      </div>

      <sl-select class="versionselect" size="small" :value="scriptorStore.state.scriptorVersion" :disabled="state.customVersion" @sl-change="changeVersion">
        <template v-for="v,i in state.versions">
          <sl-option v-if="state.customVersion" :value="state.customVersion">custom</sl-option>
          <sl-option value="latest" v-if="i===0">latest (v{{ v }})</sl-option>
          <sl-option v-else :value="`==${v}`">v{{ v }}</sl-option>
        </template>
      </sl-select>

      <slot name="startRight"></slot>
      <sl-button
        size="small"
        variant="success"
        outline
        :disabled="state.userStatus.pulse"
        @click="executeScript"
      >
        Ausführen
      </sl-button>
      <slot></slot>
    </div>
  </sl-bar>
</template>

<script setup>
import { reactive, computed, onMounted } from "vue"
import { useScriptorStore } from "../store/scriptor"
const scriptorStore = useScriptorStore()

const props = defineProps({
  id: {
    required: true
  },
  filename:{
    type:String
  }
})

const state = reactive({
  userStatus: computed(() => {
    if (scriptorStore.state.isReady && scriptorStore.state.isRunning) {
      return { text: "Skript läuft...", variant: "success", pulse: true }
    } else if (!scriptorStore.state.isReady && scriptorStore.state.isRunning) {
      return { text: "Skriptor wird geladen...", variant: "warning", pulse: true }
    } else if (scriptorStore.state.isReady && !scriptorStore.state.isRunning) {
      return { text: "Skriptor ist bereit.", variant: "success", pulse: false }
    } else {
      return { text: "Skriptor nicht geladen.", variant: "danger", pulse: false }
    }
  }),
  scriptor: computed(() => {
    return scriptorStore.state.instances[props.id]
  }),
  versions:[],
  customVersion:import.meta.env.VITE_SCRIPTOR_URL
})

async function executeScript() {
  await scriptorStore.execute(state.scriptor.scriptCode, props.id,{})
}

function reset() {
  scriptorStore.state.instances[props.id].messages = []
  scriptorStore.state.instances[props.id].internalMessages = []
  scriptorStore.state.isReady = false
  scriptorStore.state.runningActions = new Map()
}
function changeVersion(e){
  scriptorStore.state.scriptorVersion = e.target.value
  reset()
}
onMounted(()=>{
  scriptorStore.fetchScriptorVersions().then(result=>{
    state.versions = result
    if (state.customVersion){
      scriptorStore.state.scriptorVersion = state.customVersion
    }else{
      scriptorStore.state.scriptorVersion = "latest"
    }
  })
})

</script>

<style scoped>
sl-bar {
  min-height: 50px;
  padding: 10px;
  border-bottom: 1px solid var(--sl-color-neutral-400);

  & .bar--left {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: center;
    flex-wrap: nowrap;

    & sl-icon {
      width: 1.2em;
      height: 1.2em;
    }
  }
}

.right{
  gap: 5px;
}

.versionselect{
  width: 150px;
}

.scriptorprogressbar {
  width: 100%;
}

.status{
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: .9em;
  border-radius: var(--sl-border-radius-medium);
  border: 1px solid var(--vi-border-color);
  background-color: var(--sl-color-neutral-0);
  padding: 0 var(--sl-spacing-small);
  height: var(--sl-input-height-small);

  sl-badge{
    aspect-ratio: 1;
    margin-right: var(--sl-spacing-x-small);
  }
}
</style>
