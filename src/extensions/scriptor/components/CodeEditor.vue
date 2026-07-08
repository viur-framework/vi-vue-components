<template>
  <div class="wrapper">
    <div v-show="!diffMode" ref="element" class="monaco-host"></div>
    <div v-if="diffMode" class="diff-view">
      <div class="diff-actions">
        <span class="diff-label">KI-Vorschlag — bitte prüfen</span>
        <sl-button size="small" variant="success" @click="acceptDiff">✓ Übernehmen</sl-button>
        <sl-button size="small" variant="neutral" outline @click="rejectDiff">✕ Verwerfen</sl-button>
      </div>
      <div ref="diffElement" class="monaco-host"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, reactive, computed, watch, nextTick } from "vue"
import { loadMonaco } from "../composables/useMonaco"
import { registerScriptorCompletions } from "../completions"
import { ruffDiagnosticsToMarkers } from "../ruffMarkers"
import RuffWorker from "../ruff.worker.js?worker"
import { useScriptorStore } from "../store/scriptor"
import { useDBStore } from "../../../stores/db"

const scriptorStore = useScriptorStore()
const dbStore = useDBStore()

const props = defineProps({
  id: {
    required: true,
  },
})

const element = ref(null)
const diffElement = ref(null)
const diffMode = ref(false)

// Non-reactive editor handles: Monaco manages its own internal state and does
// not need Vue reactivity wrapping it.
let editor = null
let diffEditor = null
let monaco = null

// Ruff linting (best-effort, runs in a web worker).
let ruffWorker = null
let lintVersion = 0
let lintTimer = null

// Guards the change listener while we apply a programmatic update, so a
// store-driven setValue() does not echo back into the store redundantly.
let applyingProgrammaticChange = false

const state = reactive({
  scriptor: computed(() => {
    return scriptorStore.state.instances[props.id]
  }),
})

onMounted(async () => {
  monaco = await loadMonaco()

  editor = monaco.editor.create(element.value, {
    value: state.scriptor.scriptCode,
    language: "python",
    theme: "vs",
    automaticLayout: true,
    tabSize: 4,
    insertSpaces: true,
    fontSize: 13,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
  })

  // Scriptor API + module-name autocomplete (registered once, globally).
  registerScriptorCompletions(monaco, () => Object.keys(dbStore.state["vi.modules"] || {}))

  // Sync user edits into the store and re-lint on every change.
  editor.onDidChangeModelContent(() => {
    if (!applyingProgrammaticChange) {
      state.scriptor.scriptCode = editor.getValue()
    }
    scheduleLint()
  })

  setupLinter()
})

function setupLinter() {
  try {
    ruffWorker = new RuffWorker()
  } catch (e) {
    // Linting is optional; if the worker cannot start, run without it.
    ruffWorker = null
    return
  }
  ruffWorker.onmessage = (event) => {
    const { version, diagnostics } = event.data
    if (version !== lintVersion || !editor) return
    const model = editor.getModel()
    if (!model) return
    const markers = ruffDiagnosticsToMarkers(diagnostics, {
      error: monaco.MarkerSeverity.Error,
      warning: monaco.MarkerSeverity.Warning,
    })
    monaco.editor.setModelMarkers(model, "ruff", markers)
  }
  scheduleLint()
}

function scheduleLint() {
  if (!ruffWorker || !editor) return
  if (lintTimer) clearTimeout(lintTimer)
  lintTimer = setTimeout(() => {
    lintVersion += 1
    ruffWorker.postMessage({ version: lintVersion, code: editor.getValue() })
  }, 400)
}

// Apply code pushed programmatically via the store (kept from Phase 1).
watch(
  () => state.scriptor?.pendingInsert,
  (newCode) => {
    if (newCode !== null && newCode !== undefined && editor) {
      applyingProgrammaticChange = true
      editor.setValue(newCode)
      applyingProgrammaticChange = false
      state.scriptor.scriptCode = newCode
      state.scriptor.pendingInsert = null
    }
  }
)

// AI diff review (kept from Phase 2): show a Monaco diff editor comparing the
// current code (original, read-only) against the AI suggestion (modified,
// editable). The user accepts or rejects.
watch(
  () => state.scriptor?.pendingDiff,
  async (diff) => {
    if (!diff || !monaco) return
    disposeDiffEditor()
    diffMode.value = true
    await nextTick()
    const original = monaco.editor.createModel(diff.original, "python")
    const modified = monaco.editor.createModel(diff.modified, "python")
    diffEditor = monaco.editor.createDiffEditor(diffElement.value, {
      theme: "vs",
      automaticLayout: true,
      renderSideBySide: true,
      originalEditable: false,
      readOnly: false,
      fontSize: 13,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
    })
    diffEditor.setModel({ original, modified })
  }
)

function acceptDiff() {
  if (!diffEditor) return
  const modified = diffEditor.getModel().modified.getValue()
  disposeDiffEditor()
  applyingProgrammaticChange = true
  editor.setValue(modified)
  applyingProgrammaticChange = false
  state.scriptor.scriptCode = modified
  state.scriptor.pendingDiff = null
}

function rejectDiff() {
  disposeDiffEditor()
  state.scriptor.pendingDiff = null
}

function disposeDiffEditor() {
  if (diffEditor) {
    const model = diffEditor.getModel()
    diffEditor.dispose()
    if (model) {
      model.original.dispose()
      model.modified.dispose()
    }
    diffEditor = null
  }
  diffMode.value = false
}

onBeforeUnmount(() => {
  if (lintTimer) {
    clearTimeout(lintTimer)
    lintTimer = null
  }
  if (ruffWorker) {
    ruffWorker.terminate()
    ruffWorker = null
  }
  disposeDiffEditor()
  if (editor) {
    editor.dispose()
    editor = null
  }
})
</script>

<style scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}
.monaco-host {
  width: 100%;
  flex: 1;
  min-height: 0;
}
.diff-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}
.diff-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--sl-color-neutral-200, #dee2e6);
  background: var(--sl-color-warning-50, #fff8e6);
  flex-shrink: 0;
}
.diff-label {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: var(--sl-color-neutral-700, #495057);
}
</style>
