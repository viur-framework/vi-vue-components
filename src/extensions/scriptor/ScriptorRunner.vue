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

    <div v-show="state.scriptStatus && state.opened">
      <status :id="state.id" ref="scriptorAction"></status>
    </div>
  </sl-button>

  <teleport v-if="state.opened" :to="`#view_dialogs_${handlerState.tabId}`" :disabled="!state.opened">
    <sl-dialog
      id="dialog-delete"
      ref="runnerDialog"
      style="--width: 85%"
      :open="state.opened"
      :label="current['rel']['name']"
      @sl-after-hide="exitScriptor"
    >
      <div ref="messagewrapper" class="wrapper-widgets">
        <status-bar :id="state.id" :filename="current['dest']['name']"></status-bar>

        <widget-list :id="state.id"></widget-list>
      </div>
    </sl-dialog>
  </teleport>
</template>

<script setup>
import {onBeforeMount, reactive, ref, computed, inject, watch} from "vue"
import WidgetList from "./components/WidgetList.vue"
import StatusBar from "./components/StatusBar.vue"
import Status from "./components/Status.vue"
import {useScriptorStore} from "./store/scriptor"
import {Request} from "@viur/vue-utils"
import Utils from "../../utils"
import {useDebounceFn} from "@vueuse/core"

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
  scriptStatus: computed(() => {
    return scriptorAction.value?.state?.userStatus?.pulse
  }),
  opened: false,
  scriptor: computed(() => {
    return scriptorStore.state.instances[state.id]
  }),
  scriptReady: false,
})

function startScriptor(params = {}) {
  emit("start")
  state.opened = true
  params = {...params, ...props.scriptParams}
  if (!state.id) {
    state.id = scriptorStore.createNewInstance()
    Request.view("script", props.current?.["dest"]?.["key"], {group: "leaf"}).then(async (resp) => {
      const data = await resp.json()
      state.scriptor.scriptCode = data["values"]["script"].replace(/\/\/n/g, "\n")
      state.scriptReady = true
      scriptorAction.value.executeScript(params)
    })
    return
  }
  if (import.meta.env.DEV) {
    //Reload the script on DEV Mode everytime
    Request.view("script", props.current?.["dest"]?.["key"], {group: "leaf"}).then(async (resp) => {
      const data = await resp.json()
      state.scriptor.scriptCode = data["values"]["script"].replace(/\/\/n/g, "\n")
      state.scriptReady = true
      scriptorAction.value.executeScript(params)
    })
  } else {
    scriptorAction.value.executeScript(params)
  }
}

function exitScriptor() {
  emit("exit");
  state.opened = false
  scriptorAction.value.exitScript()
}

watch(
  () => state.scriptor?.messages.length,
  (newVal, oldVal) => {
    if (messagewrapper.value) {
      const scroller = useDebounceFn((event) => {
        runnerDialog.value.shadowRoot.querySelector(".dialog__body").scroll(0, 99999)
      }, 1)
      scroller()
    }
  }
)
defineExpose({startScriptor, exitScriptor})
</script>

<style scoped>
.wrapper-widgets {
  overflow-y: auto;
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
</style>
