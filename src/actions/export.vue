<template>
  <sl-button size="small" :title="$t('actions.export')" @click="openDialog">
    <sl-icon slot="prefix" name="download"></sl-icon>
    {{ $t("actions.export") }}
  </sl-button>

  <teleport v-if="state.opened" to="#dialogs" :disabled="!state.opened">
    <sl-dialog
      open
      class="export-dialog"
      style="--width: min(1100px, calc(100vw - 2rem))"
      :label="$t('export.dialog.title')"
      @sl-after-hide="closeDialog"
    >
      <div class="export-layout">
        <section class="export-config">
          <div v-if="isTree" class="field">
            <label class="field-label">{{ $t("export.selectionTypeLabel") }}</label>
            <sl-radio-group :value="state.selectionType" @sl-change="updateSelectionType">
              <sl-radio-button value="leaf">{{ $t("export.selectionType.leafs") }}</sl-radio-button>
              <sl-radio-button value="node">{{ $t("export.selectionType.nodes") }}</sl-radio-button>
            </sl-radio-group>
          </div>

          <div class="field">
            <label class="field-label">{{ $t("export.rows") }}</label>
            <div class="row-limit">
              <sl-input
                type="number"
                min="1"
                size="small"
                :disabled="state.rowLimitMode === 'all'"
                :value="state.rowLimit"
                @sl-input="updateRowLimit"
              ></sl-input>
              <sl-checkbox :checked="state.rowLimitMode === 'all'" @sl-change="toggleAllRows">
                {{ $t("export.allRows") }}
              </sl-checkbox>
            </div>
          </div>

          <div class="field">
            <label class="field-label">{{ $t("export.objectModeLabel") }}</label>
            <sl-select size="small" :value="state.objectMode" @sl-change="updateObjectMode">
              <sl-option value="string">{{ $t("export.objectMode.string") }}</sl-option>
              <sl-option value="json">{{ $t("export.objectMode.json") }}</sl-option>
            </sl-select>
          </div>

          <div class="field">
            <label class="field-label">{{ $t("export.formatLabel") }}</label>
            <sl-select size="small" :value="state.format" @sl-change="updateFormat">
              <sl-option value="excel">{{ $t("export.format.excel") }}</sl-option>
              <sl-option value="json">{{ $t("export.format.json") }}</sl-option>
              <sl-option value="csv-semicolon">{{ $t("export.format.csvSemicolon") }}</sl-option>
              <sl-option value="csv-comma">{{ $t("export.format.csvComma") }}</sl-option>
            </sl-select>
          </div>

          <div class="field">
            <div class="field-label with-actions">
              <span>{{ $t("export.columns") }}</span>
              <sl-button-group>
                <sl-button size="small" @click="toggleAllColumns">
                  {{ allColumnsSelected ? $t("selectfields.unselectall") : $t("selectfields.selectall") }}
                </sl-button>
                <sl-button size="small" @click="invertColumns">{{ $t("selectfields.invertselect") }}</sl-button>
              </sl-button-group>
            </div>
            <div class="column-list">
              <sl-checkbox
                v-for="column in state.availableColumns"
                :key="column.id"
                :checked="state.selectedColumns.includes(column.id)"
                @sl-change="toggleColumn(column.id)"
              >
                {{ column.label }}
              </sl-checkbox>
            </div>
          </div>

          <sl-alert v-if="state.error" open variant="danger">
            <sl-icon slot="icon" name="exclamation-octagon"></sl-icon>
            {{ state.error }}
          </sl-alert>
        </section>

        <section class="export-preview">
          <div class="preview-header">
            <span>{{ $t("export.previewTitle") }}</span>
            <sl-spinner-viur v-if="state.loadingPreview"></sl-spinner-viur>
          </div>

          <div v-if="state.loadingPreview" class="preview-empty">
            {{ $t("export.loading.preview") }}
          </div>

          <div v-else-if="state.previewHeaders.length === 0" class="preview-empty">
            {{ $t("export.preview.empty") }}
          </div>

          <div v-else class="preview-table-wrapper">
            <table class="preview-table">
              <thead>
                <tr>
                  <th v-for="header in state.previewHeaders" :key="header">{{ header }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in state.previewRows" :key="`preview-${rowIndex}`">
                  <td v-for="(cell, cellIndex) in row" :key="`preview-${rowIndex}-${cellIndex}`">{{ cell }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div slot="footer" class="dialog-footer">
        <sl-button @click="state.opened = false">{{ $t("abort") }}</sl-button>
        <sl-button variant="primary" :disabled="!canExport" @click="startExport">
          <sl-spinner-viur v-if="state.loadingExport" slot="prefix"></sl-spinner-viur>
          {{ state.loadingExport ? $t("export.loading.export") : $t("export.start") }}
        </sl-button>
      </div>
    </sl-dialog>
  </teleport>
</template>

<script setup>
import { computed, inject, reactive, watch } from "vue"
import { ListRequest, destroyStore } from "@viur/vue-utils"
import { useLocalStore } from "../stores/local"
import { useMessageStore } from "../stores/message"
import { i18n } from "../i18n"
import { buildExportColumns, downloadCsv, downloadExcel, downloadJson, rowsToExportTable } from "../utils/export"

const handlerState = inject("handlerState")
const currentlist = inject("currentlist", null)
const currentNodeList = inject("currentNodeList", null)
const localStore = useLocalStore()
const messageStore = useMessageStore()
const t = i18n.global.t

const state = reactive({
  opened: false,
  loadingPreview: false,
  loadingExport: false,
  availableColumns: [],
  selectedColumns: [],
  rowLimitMode: "limit",
  rowLimit: String(localStore.state.listamount || "30"),
  objectMode: "string",
  format: "excel",
  previewRows: [],
  previewHeaders: [],
  selectionType: "leaf",
  error: "",
  previewToken: 0,
})

const isTree = computed(() => handlerState?.type === "treehandler")
const allColumnsSelected = computed(() => {
  return state.availableColumns.length > 0 && state.selectedColumns.length === state.availableColumns.length
})
const canExport = computed(() => {
  return (
    state.selectedColumns.length > 0 &&
    state.availableColumns.length > 0 &&
    !state.loadingExport &&
    !state.loadingPreview
  )
})

function cloneParams(params = {}) {
  const cloned = { ...params }
  delete cloned.cursor
  return cloned
}

function getSourceList() {
  if (isTree.value && state.selectionType === "node" && currentNodeList) {
    return currentNodeList
  }
  return currentlist
}

function getStructureFromSource() {
  const sourceList = getSourceList()
  return sourceList?.structure || {}
}

function getDefaultSelectedColumns(columns) {
  if (!Array.isArray(columns)) {
    return []
  }

  const preferredBones = Array.isArray(handlerState?.selectedBones) ? handlerState.selectedBones : []
  const preferred = columns.filter((column) => preferredBones.includes(column.boneName)).map((column) => column.id)

  if (preferred.length > 0) {
    return preferred
  }

  return columns.map((column) => column.id)
}

function syncColumns(structure, keepSelection = true) {
  const columns = buildExportColumns(structure, handlerState?.selectedBones || [])
  state.availableColumns = columns

  const validSelection = state.selectedColumns.filter((columnId) => columns.some((column) => column.id === columnId))
  const currentSelection = state.selectedColumns.join("|")

  if (keepSelection) {
    if (currentSelection === "") {
      state.selectedColumns = []
      return
    }

    if (currentSelection !== validSelection.join("|")) {
      state.selectedColumns = validSelection
    }
    return
  }

  const defaultSelection = getDefaultSelectedColumns(columns)
  if (currentSelection !== defaultSelection.join("|")) {
    state.selectedColumns = defaultSelection
  }
}

function buildHeaders() {
  const selectedBoneNames = [
    ...new Set(
      state.availableColumns
        .filter((column) => state.selectedColumns.includes(column.id))
        .map((column) => column.boneName)
    ),
  ]

  if (selectedBoneNames.length === 0) {
    return null
  }

  return {
    "x-viur-bonelist": selectedBoneNames.join(","),
  }
}

function buildRequestConfig(limit) {
  const sourceList = getSourceList()
  const sourceParams = cloneParams(sourceList?.state?.params || {})
  const headers = {
    ...(sourceList?.state?.headers || {}),
    ...(buildHeaders() || {}),
  }

  if (limit) {
    sourceParams.limit = limit
  }

  if (isTree.value) {
    const activePath = Array.isArray(handlerState?.currentPath) ? handlerState.currentPath : []
    const activeEntry = activePath[activePath.length - 1]
    if (activeEntry?.key) {
      sourceParams.parententry = activeEntry.key
    }
    sourceParams.skelType = state.selectionType
  }

  return {
    module: sourceList?.state?.module || handlerState?.module,
    params: sourceParams,
    group: sourceList?.state?.group || handlerState?.group || null,
    renderer: sourceList?.state?.renderer,
    cached: sourceList?.state?.cached ?? localStore.state.cache,
    headers,
  }
}

function createExportRequest(limit) {
  const requestId = `export_${handlerState?.module}_${Date.now()}_${Math.floor(Math.random() * 100000)}`
  const config = buildRequestConfig(limit)
  return ListRequest(requestId, config)
}

async function fetchRows(limit, fetchAll = false) {
  const exportRequest = createExportRequest(limit)

  try {
    if (fetchAll) {
      await exportRequest.fetchAll()
    } else {
      await exportRequest.fetch()
    }

    return {
      rows: exportRequest.state.skellist.slice(),
      structure: { ...(exportRequest.structure || {}) },
    }
  } finally {
    destroyStore(exportRequest)
  }
}

async function loadPreview() {
  if (!state.opened) {
    return
  }

  state.loadingPreview = true
  state.error = ""
  const currentToken = state.previewToken + 1
  state.previewToken = currentToken

  try {
    const previewLimit =
      state.rowLimitMode === "all" ? 3 : String(Math.max(1, Number.parseInt(state.rowLimit || "3", 10) || 3))
    const { rows, structure } = await fetchRows(previewLimit, false)

    if (state.previewToken !== currentToken) {
      return
    }

    syncColumns(structure, true)

    const selectedColumns = state.availableColumns.filter((column) => state.selectedColumns.includes(column.id))
    const table = rowsToExportTable({
      rows: rows.slice(0, 7),
      columns: selectedColumns,
      structure,
      objectMode: state.objectMode,
      outputFormat: "preview",
      t,
    })

    state.previewHeaders = table.headers
    state.previewRows = table.rowArrays
  } catch (error) {
    if (state.previewToken !== currentToken) {
      return
    }

    state.previewHeaders = []
    state.previewRows = []
    state.error = error?.message || t("error")
    messageStore.addMessage("error", state.error, error?.response?.url)
  } finally {
    if (state.previewToken === currentToken) {
      state.loadingPreview = false
    }
  }
}

function openDialog() {
  state.opened = true
  state.selectionType = isTree.value ? handlerState?.currentSelectionType || "leaf" : "leaf"
  state.rowLimit = String(localStore.state.listamount || "30")
  state.rowLimitMode = "limit"
  state.objectMode = "string"
  state.format = "excel"
  state.error = ""
  state.previewHeaders = []
  state.previewRows = []
  syncColumns(getStructureFromSource(), false)
}

function closeDialog() {
  state.opened = false
  state.loadingPreview = false
  state.loadingExport = false
  state.error = ""
}

function toggleColumn(columnId) {
  if (state.selectedColumns.includes(columnId)) {
    state.selectedColumns = state.selectedColumns.filter((id) => id !== columnId)
  } else {
    state.selectedColumns = state.selectedColumns.concat(columnId)
  }
}

function selectAllColumns() {
  state.selectedColumns = state.availableColumns.map((column) => column.id)
}

function toggleAllColumns() {
  if (allColumnsSelected.value) {
    state.selectedColumns = []
    return
  }

  selectAllColumns()
}

function invertColumns() {
  state.selectedColumns = state.availableColumns
    .map((column) => column.id)
    .filter((columnId) => !state.selectedColumns.includes(columnId))
}

function toggleAllRows(event) {
  state.rowLimitMode = event.target.checked ? "all" : "limit"
}

function updateRowLimit(event) {
  const parsedValue = Math.max(1, Number.parseInt(event.target.value || "1", 10) || 1)
  state.rowLimit = String(parsedValue)
}

function updateObjectMode(event) {
  state.objectMode = event.target.value
}

function updateFormat(event) {
  state.format = event.target.value
}

function updateSelectionType(event) {
  state.selectionType = event.target.value
}

async function startExport() {
  if (!canExport.value) {
    return
  }

  state.loadingExport = true
  state.error = ""

  try {
    const exportLimit =
      state.rowLimitMode === "all"
        ? String(localStore.state.listamount || "30")
        : String(Math.max(1, Number.parseInt(state.rowLimit || "1", 10) || 1))
    const { rows, structure } = await fetchRows(exportLimit, state.rowLimitMode === "all")

    syncColumns(structure, true)

    const selectedColumns = state.availableColumns.filter((column) => state.selectedColumns.includes(column.id))
    const table = rowsToExportTable({
      rows,
      columns: selectedColumns,
      structure,
      objectMode: state.objectMode,
      outputFormat: state.format === "json" ? "json" : "excel",
      t,
    })

    if (state.format === "json") {
      downloadJson(handlerState?.module, table.rowObjects)
    } else if (state.format === "csv-semicolon") {
      downloadCsv(handlerState?.module, table.rowObjects, ";")
    } else if (state.format === "csv-comma") {
      downloadCsv(handlerState?.module, table.rowObjects, ",")
    } else {
      await downloadExcel(handlerState?.module, table.rowObjects)
    }

    state.opened = false
  } catch (error) {
    state.error = error?.message || t("error")
    messageStore.addMessage("error", state.error, error?.response?.url)
  } finally {
    state.loadingExport = false
  }
}

watch(
  () => [
    state.opened,
    state.selectionType,
    state.objectMode,
    state.rowLimitMode,
    state.rowLimit,
    state.selectedColumns.join("|"),
  ],
  ([opened]) => {
    if (opened) {
      loadPreview()
    }
  }
)
</script>

<style scoped>
.export-layout {
  display: grid;
  grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
  gap: var(--sl-spacing-large);
}

.export-config {
  display: flex;
  flex-direction: column;
  gap: var(--sl-spacing-medium);
}

.export-preview {
  min-width: 0;
  border: 1px solid var(--sl-color-neutral-200);
  border-radius: var(--sl-border-radius-medium);
  padding: var(--sl-spacing-medium);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--sl-spacing-medium);
  font-weight: 600;
}

.preview-empty {
  color: var(--sl-color-neutral-500);
}

.preview-table-wrapper {
  overflow: auto;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
}

.preview-table th,
.preview-table td {
  border: 1px solid var(--sl-color-neutral-200);
  padding: 0.45rem 0.6rem;
  text-align: left;
  vertical-align: top;
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--sl-spacing-x-small);
}

.field-label {
  font-weight: 600;
}

.with-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sl-spacing-small);
}

.row-limit {
  display: flex;
  align-items: center;
  gap: var(--sl-spacing-small);
}

.row-limit sl-input {
  max-width: 120px;
}

.column-list {
  max-height: 260px;
  overflow: auto;
  border: 1px solid var(--sl-color-neutral-200);
  border-radius: var(--sl-border-radius-medium);
  padding: var(--sl-spacing-small);
}

.column-list sl-checkbox {
  display: flex;
  margin-bottom: 0.35rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--sl-spacing-small);
}

@media (max-width: 900px) {
  .export-layout {
    grid-template-columns: 1fr;
  }
}
</style>
