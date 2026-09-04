<template>
  <sl-bar>
    <div slot="left" class="bar--left">
      <sl-icon name="file-earmark-code-fill"></sl-icon>
      <template v-if="filename">
        {{ filename }}
      </template>
      <template v-else>Scriptor</template>
    </div>

    <div slot="center">
    </div>

    <div slot="right">
      <sl-badge
        :variant="state.userStatus['variant']"
        pill
        :title="state.userStatus['text']"
        :pulse="state.userStatus['pulse']"
        @click="reset"
      >
        <span v-if="state.scriptor?.envState === 'ready'">&nbsp;&nbsp;</span>
        <span v-else>&nbsp;&nbsp;</span>
      </sl-badge>
      <sl-select
        class="versionselect"
        size="small"
        :value="scriptorStore.state.scriptorVersion"
        :disabled="state.customVersion"
        @sl-change="changeVersion"
      >
        <template v-for="(v, i) in state.versions">
          <sl-option v-if="state.customVersion" :value="state.customVersion">custom</sl-option>
          <sl-option v-if="i === 0" value="latest">latest (v{{ v }})</sl-option>
          <sl-option v-else :value="`==${v}`">v{{ v }}</sl-option>
        </template>
      </sl-select>

      <slot name="startRight"></slot>
      <sl-button size="small" variant="success" outline :disabled="state.userStatus.pulse" @click="executeScript">
        Ausführen
      </sl-button>
      <slot></slot>
    </div>
  </sl-bar>
  <div v-if="state.scriptor?.progress?.max_step > -1"
       class="status-bar-progress-bar">
    <sl-progress-bar
      :value="state.scriptor.progress.total"
      label="Upload progress"
    ></sl-progress-bar>
    <div class="status-bar-progress-text">
      {{ state.scriptor.progress.step }}/{{ state.scriptor.progress.max_step }} ({{
        Math.floor(state.scriptor.progress.total)
      }}%)
      {{ state.scriptor.progress.txt }}
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted } from "vue"
import { useScriptorStore } from "../store/scriptor"
import { describeInstanceStatus } from "../store/instanceStatus"
const scriptorStore = useScriptorStore()

const props = defineProps({
  id: {
    required: true,
  },
  filename: {
    type: String,
  },
})

const state = reactive({
  scriptor: computed(() => {
    return scriptorStore.state.instances[props.id]
  }),
  userStatus: computed(() => {
    return describeInstanceStatus(scriptorStore.state.instances[props.id])
  }),
  versions: [],
  customVersion: import.meta.env.VITE_SCRIPTOR_URL,
})

async function executeScript() {
  await scriptorStore.execute(state.scriptor.scriptCode, props.id, {})
}

function reset() {
  const instance = scriptorStore.state.instances[props.id]
  if (!instance) {
    return
  }
  instance.messages = []
  instance.internalMessages = []
}

// A new Scriptor version needs a new environment. Only THIS instance's worker
// is discarded — other scripts running in parallel are unaffected.
function changeVersion(e) {
  scriptorStore.state.scriptorVersion = e.target.value
  reset()
  if (props.id) {
    scriptorStore.destroyInstance(props.id)
    scriptorStore.createNewInstance(props.id)
  }
}
onMounted(() => {
  scriptorStore.fetchScriptorVersions().then((result) => {
    state.versions = result
    // StatusBar lives in the dialog and remounts when restoring from
    // minimized. An already-set version (default or custom) must not be
    // overwritten then — otherwise the next close would compare the worker
    // against the reset version instead of the actually loaded envVersion,
    // breaking worker recycling.
    if (scriptorStore.state.scriptorVersionInitialized) {
      return
    }
    scriptorStore.state.scriptorVersionInitialized = true
    if (state.customVersion) {
      scriptorStore.state.scriptorVersion = state.customVersion
    } else {
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
sl-badge {
  margin-right: 5px;
  margin-left: 5px;
}
.versionselect {
  width: 150px;
  margin-right: 5px;
}

.status-bar-progress-bar{
  width: 100%;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--sl-spacing-small);
  background-color: var(--sl-color-neutral-100);
  border: 1px solid var(--vi-border-color);
  border-radius: var(--sl-border-radius-medium);
  padding: var(--sl-spacing-x-small) var(--sl-spacing-small);
  margin: 10px 0;

  sl-progress-bar{
    --height: 4px;
    flex: 1;

    &::part(base){
      box-shadow: none;
    }
  }
}

.status-bar-progress-text{
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  font-size: .8em;
  font-weight: 700;
}
</style>
