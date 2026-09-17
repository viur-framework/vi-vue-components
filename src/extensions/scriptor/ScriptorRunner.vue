<template>
  <sl-button
    v-if="canAccess"
    size="small"
    :disabled="(!active && !state.scriptReady) || disabled"
    :title="current['rel']['name']"
    @click="startScriptor"
  >
    <sl-icon v-if="current['rel']['icon']" slot="prefix" :name="iconInfo[1]" :library="iconInfo[0]"></sl-icon>
    <template v-if="!iconOnly">
      {{ current["rel"]["name"] }}
    </template>

    <div v-if="state.id" slot="suffix">
      <status :id="state.id" ref="scriptorAction"></status>
    </div>
    <sl-progress-bar
      class="runner-button-progress-bar"
      v-if="state.id && state.scriptor?.progress?.max_step > -1"
      :value="state.scriptor.progress.total"
    ></sl-progress-bar>
  </sl-button>

  <teleport v-if="state.opened" :to="`#view_dialogs_${handlerState.tabId}`" :disabled="!state.opened">
    <sl-dialog
      id="dialog-delete"
      ref="runnerDialog"
      style="--width: 85%"
      :open="state.opened"
      :label="current['rel']['name']"
      @sl-after-hide="handleAfterHide"
      @sl-request-close="handleRequestClose"
    >
      <sl-icon-button
        slot="header-actions"
        name="dash"
        :label="$t('actions.minimize')"
        @click="minimizeScriptor"
      ></sl-icon-button>

      <div ref="messagewrapper" class="wrapper-widgets">
        <status-bar :id="state.id" :filename="current['dest']['name']"></status-bar>

        <widget-list :id="state.id"></widget-list>
      </div>
    </sl-dialog>
  </teleport>

  <teleport v-if="state.confirmClose" :to="`#view_dialogs_${handlerState.tabId}`" :disabled="!state.confirmClose">
    <sl-dialog
      :label="$t('actions.close_confirm.title')"
      open
      @sl-after-hide="state.confirmClose = false"
    >
      {{ $t("actions.close_confirm.text") }}
      <div class="btn-wrap" slot="footer">
        <sl-button variant="danger" @click="confirmCloseScriptor">
          {{ $t("actions.close_confirm.close") }}
        </sl-button>
        <sl-button variant="default" @click="confirmMinimizeScriptor">
          {{ $t("actions.minimize") }}
        </sl-button>
      </div>
    </sl-dialog>
  </teleport>
</template>

<script setup>
import { onBeforeMount, onBeforeUnmount, reactive, ref, computed, inject, watch } from "vue"
import WidgetList from "./components/WidgetList.vue"
import StatusBar from "./components/StatusBar.vue"
import Status from "./components/Status.vue"
import { useScriptorStore } from "./store/scriptor"
import { Request } from "@viur/vue-utils"
import Utils from "../../utils"
import { useDebounceFn } from "@vueuse/core"

const messagewrapper = ref(null)
const scriptorAction = ref(null)
const runnerDialog = ref(null)

const handlerState = inject("handlerState")
const emit = defineEmits(["start", "exit"])
const props = defineProps({
  canAccess: {
    type: Boolean,
  },
  current: {
    type: Object,
  },
  iconInfo: {
    type: Array,
  },
  active: {
    type: Boolean,
  },
  iconOnly: {
    type: Boolean,
  },
  disabled: {
    type: Boolean,
  },
  scriptParams: {
    type: Object,
  },
})

const scriptorStore = useScriptorStore()
const state = reactive({
  id: null,
  opened: false,
  scriptor: computed(() => {
    return scriptorStore.state.instances[state.id]
  }),
  scriptReady: false,
  // Set when the dialog is hidden on purpose. Without it, the sl-after-hide
  // handler cannot tell minimizing from closing.
  minimized: false,
  // Shows the close-vs-minimize confirmation when the close button is used
  // while a script is running.
  confirmClose: false,
})

function startScriptor(params = {}) {
  // Minimized window: just show it again, never run anything. The flag is
  // cleared here too, because sl-after-hide may never have fired on minimize.
  if (state.id && !state.opened) {
    state.minimized = false
    state.opened = true
    return
  }
  emit("start")
  state.opened = true
  params = { ...params, ...props.scriptParams }
  if (!state.id) {
    state.id = scriptorStore.createNewInstance()
    const openedId = state.id
    Request.view("script", props.current?.["dest"]?.["key"], { group: "leaf" }).then(async (resp) => {
      // Window closed meanwhile: the instance is gone.
      if (state.id !== openedId) {
        return
      }
      const data = await resp.json()
      state.scriptor.scriptCode = data["values"]["script"].replace(/\/\/n/g, "\n")
      state.scriptReady = true
      scriptorAction.value.executeScript(params)
    })
    return
  }
  if (import.meta.env.DEV) {
    const openedId = state.id
    Request.view("script", props.current?.["dest"]?.["key"], { group: "leaf" }).then(async (resp) => {
      if (state.id !== openedId) {
        return
      }
      const data = await resp.json()
      state.scriptor.scriptCode = data["values"]["script"].replace(/\/\/n/g, "\n")
      state.scriptReady = true
      scriptorAction.value.executeScript(params)
    })
  } else {
    scriptorAction.value.executeScript(params)
  }
}

// Hides the dialog without tearing down the instance: worker, output and a
// running script stay alive. The script button brings it back.
function minimizeScriptor() {
  state.minimized = true
  state.opened = false
}

// sl-dialog closes itself on an overlay click and on escape, both of which
// would run exitScriptor and lose a running script. Overlay clicks are blocked
// outright, escape minimizes. The close button would still abort a running
// script outright, so it asks for confirmation instead when one is running.
function handleRequestClose(event) {
  const source = event.detail?.source

  if (source === "overlay") {
    event.preventDefault()
    return
  }

  if (source === "keyboard") {
    event.preventDefault()
    minimizeScriptor()
    return
  }

  // runState only flips to "running" once the Pyodide environment has
  // finished loading (see store/scriptor.js execute()) — the install phase
  // beforehand (envState "loading") can take just as long and would abort
  // the same way, so it needs the same guard.
  const taskRunning = state.scriptor?.runState === "running" || state.scriptor?.envState === "loading"
  if (taskRunning) {
    event.preventDefault()
    state.confirmClose = true
  }
}

function confirmCloseScriptor() {
  state.confirmClose = false
  exitScriptor()
}

function confirmMinimizeScriptor() {
  state.confirmClose = false
  minimizeScriptor()
}

// sl-after-hide is unreliable on minimize: state.opened = false drops the
// teleport via v-if before the event can fire. On the close button it fires
// reliably, so the flag is cleared here AND in startScriptor.
function handleAfterHide() {
  if (state.minimized) {
    state.minimized = false
    return
  }
  exitScriptor()
}

function exitScriptor() {
  emit("exit")
  state.opened = false
  // exitScriptor is exposed via defineExpose. A leftover flag would block the
  // state machine (see handleAfterHide/startScriptor) afterwards.
  state.minimized = false
  if (state.id) {
    scriptorStore.destroyInstance(state.id)
  }
  // Required: startScriptor() checks `if (!state.id)` to load code and create an
  // instance. A stale id would reopen the dialog onto a deleted one.
  state.id = null
  state.scriptReady = false
}

// The action bar holding this runner is kept alive (main/ViewWrapper.vue), so a
// tab switch only deactivates it and a minimized window survives that on
// purpose. This fires when the vi tab itself closes, where cleanup is needed:
// state.id would go with the component while instance and worker live on in the
// store, unreachable. destroyInstance parks the worker, so the environment
// itself is not lost.
onBeforeUnmount(() => {
  if (state.id) {
    scriptorStore.destroyInstance(state.id)
  }
  // Without this the guard in startScriptor() (`state.id !== openedId`) misses
  // an aborted load, and a pending Request.view callback writes to
  // state.scriptor after the instance is gone.
  state.id = null
})

watch(
  () => state.scriptor?.messages.length,
  (newVal, oldVal) => {
    // newVal is undefined once exitScriptor() dropped the instance and nulled
    // state.id — nothing left to scroll.
    if (newVal === undefined || !messagewrapper.value) {
      return
    }
    const scroller = useDebounceFn((event) => {
      // The dialog hangs on the teleport's v-if and can vanish between the
      // watcher firing and the debounce elapsing — closing does exactly that.
      runnerDialog.value?.shadowRoot?.querySelector(".dialog__body")?.scroll(0, 99999)
    }, 1)
    scroller()
  }
)
defineExpose({ startScriptor, exitScriptor })
</script>

<style scoped>
.wrapper-widgets {
  overflow-y: auto;

  &:deep(sl-bar){
    padding: 0;
    margin-top: -10px;
  }

  &:deep(sl-bar + .wrapper-widget){
    margin-top: 10px;
  }


  &:deep(.wrapper-widget){
    padding: 0;
  }
}

.tabpopup {
  &::part(base) {
    position: absolute;
    height: 100%;
  }

  &::part(panel) {
    height: 100%;
    max-height: calc(100% - 100px);
    margin-bottom: 40px;
  }

  &::part(body) {
    padding: 0;
    /*display: contents;*/
  }

  &::part(footer) {
    padding: var(--sl-spacing-small);
  }

  &::part(overlay) {
    position: absolute;
  }

  &:deep(.bar sl-button[variant="success"]) {
    &::part(base) {
      background-color: transparent;
      border: 1px solid var(--sl-color-success-500);
      aspect-ratio: 1;
      padding: 0;
    }

    &::part(label) {
      display: none;
    }

    &::part(prefix) {
      color: var(--sl-color-success-500);
    }
  }
}

sl-button{
  &::part(base){
    overflow: hidden;
    position: relative;
  }
  &::part(suffix){
    display: flex !important;
    margin-left: auto;
  }
}

.runner-button-progress-bar{
  --height: 2px;
  --indicator-color: var(--sl-color-success-500);
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  mix-blend-mode: multiply;

  &::part(base){
    box-shadow: none;
  }
}

.btn-wrap{
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
</style>
