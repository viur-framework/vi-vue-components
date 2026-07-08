<template>
  <sl-split-panel vertical style="height: 100%; --min: 50px; --max: 100%" position="50">
    <div slot="start" class="wrapper-outer-wrap">
      <status-bar :id="state.id" :filename="state.script?.name">
        <template #startRight>
          <sl-button size="small" variant="info" outline style="margin-right: 10px" @click="clearlog">
            {{ $t("actions.clear_log") }}
          </sl-button>
        </template>
        <sl-button :loading="state.saving" size="small" variant="success" style="margin-left: 10px" @click="saveCode">
          {{ $t("actions.save") }}
        </sl-button>
      </status-bar>
      <div class="wrapper-editor">
        <sl-split-panel v-if="hasAssistant" class="editor-split" style="--min: 150px" position="75">
          <div slot="start" class="editor-split__pane">
            <code-editor v-if="state.script" :id="state.id"></code-editor>
            <sl-spinner v-else></sl-spinner>
          </div>
          <div slot="end" class="editor-split__pane">
            <ai-panel
              v-if="state.script"
              :instance-id="state.id"
              :current-code="state.scriptor?.scriptCode ?? ''"
            ></ai-panel>
          </div>
        </sl-split-panel>
        <template v-else>
          <code-editor v-if="state.script" :id="state.id"></code-editor>
          <sl-spinner v-else></sl-spinner>
        </template>
      </div>
    </div>
    <div slot="end" ref="messagewrapper" class="wrapper-widgets">
      <widget-list :id="state.id"></widget-list>
    </div>
  </sl-split-panel>
</template>

<script setup>
import { reactive, onMounted, onBeforeMount, computed, watch, ref } from "vue"
import WidgetList from "./components/WidgetList.vue"
import StatusBar from "./components/StatusBar.vue"
import CodeEditor from "./components/CodeEditor.vue"
import AiPanel from "./components/AiPanel.vue"
import { useScriptorStore } from "./store/scriptor"
import { Request } from "@viur/vue-utils"
import { useDebounceFn } from "@vueuse/core/index"
import { useDBStore } from "../../stores/db"

const dbStore = useDBStore()
const messagewrapper = ref(null)

const props = defineProps({
  module: { type: String },
  skelkey: { type: String },
  skeltype: { type: String },
})

const scriptorStore = useScriptorStore()
const state = reactive({
  id: null,
  scriptor: computed(() => {
    return scriptorStore.state.instances[state.id]
  }),
  script: null,
  saving: false,
})

// Show the AI assistant panel only when the assistant module is available in
// this app (the viur-assistant module is registered under the name "assistant").
const hasAssistant = computed(() => {
  const modules = dbStore.state["vi.modules"] || {}
  return "assistant" in modules || "viur-assistant" in modules
})

onBeforeMount(() => {
  state.id = scriptorStore.createNewInstance()
  loadCode()
})

function loadCode() {
  console.log(props)
  if (!props.skelkey) {
    return
  }
  Request.edit(props.module, props.skelkey, { group: props.skeltype }).then(async (resp) => {
    let data = await resp.json()
    state.script = data["values"]

    state.scriptor.scriptCode = data["values"]["script"]
    state.scriptor.scriptKey = data["values"]["key"]
  })
}

function saveCode() {
  state.saving = true
  Request.securePost(`/vi/${props.module}/edit/${props.skeltype}/${props.skelkey}`, {
    dataObj: {
      script: state.scriptor.scriptCode,
    },
  }).then(async (resp) => {
    let data = await resp.json()
    state.saving = false
  })
  let currentTab = dbStore.getActiveTab()
  currentTab["update"] = true
}

function clearlog() {
  state.scriptor.messages = []
}

watch(
  () => state.scriptor?.messages.length,
  (newVal, oldVal) => {
    if (messagewrapper.value) {
      const scroller = useDebounceFn((event) => {
        messagewrapper.value.scrollTop = 999999
      }, 1)
      scroller()
    }
  }
)
</script>
<style scoped>
.wrapper-editor {
  height: calc(100% - 50px);
  width: 100%;
}

.editor-split {
  width: 100%;
  height: 100%;
}

.editor-split__pane {
  height: 100%;
  overflow: hidden;

  sl-spinner {
    display: block;
    margin: 2em auto;
    font-size: 2em;
    --track-width: 0.1em;
  }
}

.wrapper-widgets {
  overflow-y: auto;
}

.wrapper-outer-wrap {
  min-width: 1px;
}
</style>
