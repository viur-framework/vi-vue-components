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

    <div slot="right">
      
      <sl-badge
        :variant="state.userStatus['variant']"
        pill
        :title="state.userStatus['text']"
        :pulse="state.userStatus['pulse']"
        @click="reset"
      >
        <span v-if="scriptorStore.state.isReady">&nbsp;&nbsp;</span>
        <span v-else>&nbsp;&nbsp;</span>
      </sl-badge>
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
import { reactive, computed } from "vue"
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
  })
})

async function executeScript() {
  await scriptorStore.execute(state.scriptor.scriptCode, props.id)
}

function reset() {
  scriptorStore.state.instances[props.id].messages = []
  scriptorStore.state.instances[props.id].internalMessages = []
  scriptorStore.state.isReady = false
  scriptorStore.state.runningActions = new Map()
}
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
sl-badge {
  margin-right: 5px;
  margin-left: 5px;
}
.scriptorprogressbar {
  width: 100%;
}
</style>
