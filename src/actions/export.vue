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
      :label="dialogLabel"
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
            <label class="field-label">{{ $t("export.filter.label") }}</label>
            <div class="filter-builder">
              <sl-select
                size="small"
                hoist
                clearable
                :placeholder="$t('export.filter.selectBone')"
                :value="state.filterBoneKey"
                @sl-change="selectFilterBone"
                @sl-clear="clearFilterBone"
              >
                <template v-for="(bone, boneName) in getStructureFromSource()">
                  <sl-option v-if="filterableField(bone)" :key="boneName" :value="boneName">
                    {{ bone.descr || boneName }}
                  </sl-option>
                </template>
              </sl-select>

              <template v-if="state.filterBone">
                <sl-select
                  v-if="filterOperators.length > 1"
                  size="small"
                  hoist
                  :value="state.filterOperator"
                  @sl-change="updateFilterOperator"
                >
                  <sl-option v-for="op in filterOperators" :key="op.value" :value="op.value">{{ op.label }}</sl-option>
                </sl-select>

                <sl-switch
                  v-if="filterBoneType === 'bool'"
                  :checked="state.filterValue === true"
                  @sl-change="updateFilterBool"
                ></sl-switch>
                <sl-select
                  v-else-if="filterBoneType === 'select'"
                  size="small"
                  hoist
                  :value="state.filterValue"
                  @sl-change="updateFilterValue"
                >
                  <sl-option v-for="opt in filterSelectOptions" :key="opt[0]" :value="opt[0]">
                    {{ opt[1] }}
                  </sl-option>
                </sl-select>
                <sl-input
                  v-else-if="filterBoneType === 'date'"
                  size="small"
                  :type="filterDateInputType"
                  step="1"
                  :value="state.filterValue"
                  @sl-change="updateFilterValue"
                ></sl-input>
                <sl-input
                  v-else
                  size="small"
                  :type="filterBoneType === 'numeric' ? 'number' : 'text'"
                  :value="state.filterValue"
                  @sl-input="updateFilterValue"
                ></sl-input>

                <sl-button size="small" variant="primary" :disabled="!canAddFilter" @click="addFilter">
                  {{ $t("export.filter.add") }}
                </sl-button>
              </template>
            </div>

            <sl-alert v-if="filterCombinationUncovered" open variant="warning" class="filter-hint">
              <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
              {{ $t("export.filter.indexRequired") }}
            </sl-alert>

            <div v-if="state.filters.length > 0" class="filter-chips">
              <sl-tag
                v-for="f in state.filters"
                :key="f.filterKey"
                size="small"
                removable
                @sl-remove="removeFilter(f.filterKey)"
              >
                {{ f.name }}
              </sl-tag>
            </div>
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

          <div v-if="state.loadingPreview" class="preview-empty preview-loading">
            <sl-spinner></sl-spinner>
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
        <sl-button size="small" @click="state.opened = false">{{ $t("abort") }}</sl-button>
        <sl-button size="small" variant="primary" :disabled="!canExport" @click="startExport">
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
  filters: [],
  filterBoneKey: "",
  filterBone: null,
  filterOperator: "=",
  filterValue: "",
})

const isTree = computed(() => handlerState?.type === "treehandler")

// Dialog title with the current tab/panel name appended, e.g. "Export - ist bestellt".
const dialogLabel = computed(() => {
  const tabName = handlerState?.conf?.name
  return tabName ? `${t("export.dialog.title")} - ${tabName}` : t("export.dialog.title")
})
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

const filterBoneType = computed(() => {
  const type = state.filterBone?.type || ""
  if (type.startsWith("bool")) return "bool"
  if (type.startsWith("numeric")) return "numeric"
  if (type.startsWith("date")) return "date"
  if (type.startsWith("select")) return "select"
  return "str"
})

const filterSelectOptions = computed(() => {
  const values = state.filterBone?.values
  if (Array.isArray(values)) return values
  if (values && typeof values === "object") return Object.entries(values)
  return []
})

const filterDateInputType = computed(() => {
  if (state.filterBone?.date === false) return "time"
  if (state.filterBone?.time === false) return "date"
  return "datetime-local"
})

const filterOperators = computed(() => {
  if (filterBoneType.value === "numeric") {
    return [
      { value: "=", label: "=" },
      { value: "$lt", label: "<" },
      { value: "$gt", label: ">" },
    ]
  }
  if (filterBoneType.value === "date") {
    return [
      { value: "=", label: t("export.filter.op.equals") },
      { value: "$gt", label: t("export.filter.op.after") },
      { value: "$lt", label: t("export.filter.op.before") },
    ]
  }
  if (filterBoneType.value === "str") {
    return [
      { value: "=", label: t("export.filter.op.equals") },
      { value: "$lk", label: t("export.filter.op.contains") },
    ]
  }
  return [{ value: "=", label: "=" }]
})

// conf of the currently open panel (module + view) — carries the inherited `indexes`
// and the view-specific preset `filter`.
const moduleIndexes = computed(() => {
  return Array.isArray(handlerState?.conf?.indexes) ? handlerState.conf.indexes : []
})

const RESERVED_LIST_PARAMS = new Set([
  "orderby",
  "orderdir",
  "amount",
  "limit",
  "cursor",
  "search",
  "skelType",
  "parententry",
])

const baseFilter = computed(() => handlerState?.conf?.filter || {})

// Sort fields pinned by the preset conf.filter (orderby), reduced to base property names.
function sortFields() {
  const orderby = baseFilter.value.orderby
  if (!orderby) return []
  return String(orderby)
    .split(",")
    .map((entry) => entry.replace(/^-/, "").trim().split(".")[0])
    .filter(Boolean)
}

// Split the preset conf.filter into equality and inequality ($lt/$gt/$lk) fields (base names).
function basePartition() {
  const eq = []
  const ineq = []
  for (const key of Object.keys(baseFilter.value)) {
    if (key === "orderby" || RESERVED_LIST_PARAMS.has(key)) continue
    const field = key.split("$")[0].split(".")[0]
    if (/\$(lt|gt|lk)/.test(key)) ineq.push(field)
    else eq.push(field)
  }
  return { eq, ineq }
}

// True if a single composite index contains all given fields. index.yaml properties may carry
// suffixes (e.g. "category.dest.__key__", "item_name.idx"), so we match the base name before the dot.
function indexContainsAll(fields) {
  const unique = [...new Set(fields)]
  if (unique.length <= 1) return true
  return moduleIndexes.value.some((index) => {
    const props = new Set((index.properties || []).map((p) => String(p).split(".")[0]))
    return unique.every((field) => props.has(field))
  })
}

// Approximates Datastore's serving rules for the (equality/inequality + orderby) query the export
// would run. Datastore serves via built-in indexes and merge joins in these cases without a single
// composite index:
//  - equality-only filters (any number), no sort            → built-in index merging
//  - equality filters + a shared sort (and/or a range on the sort field itself)
//                                                            → merge of per-field [field, sort] indexes
// A single composite index covering everything is only required once there is an inequality on a
// field OTHER than the sort field (merge joins can't span that).
function combinationCovered(filterList) {
  const sorts = sortFields()
  const base = basePartition()
  const eqFields = new Set(base.eq)
  const ineqFields = new Set(base.ineq)
  for (const f of filterList) {
    if (!f.boneKey) continue
    if (f.operator && f.operator !== "=") ineqFields.add(f.boneKey)
    else eqFields.add(f.boneKey)
  }

  const extraInequality = [...ineqFields].filter((field) => !sorts.includes(field))
  if (extraInequality.length > 0) {
    return indexContainsAll([...eqFields, ...ineqFields, ...sorts])
  }

  if (sorts.length === 0) return true // equality-only → built-in index merging
  // sort pinned: each equality field must co-occur with the sort field(s) in some index (merge join)
  return [...eqFields].every((field) => indexContainsAll([field, ...sorts]))
}

// Advisory only: the combination is not provably covered by an index. Adding is still allowed —
// Datastore is the final authority and a rejected query surfaces via the 500 handler.
const filterCombinationUncovered = computed(() => {
  if (!state.filterBone) return false
  const prospective = [
    ...state.filters.map((f) => ({ boneKey: f.boneKey, operator: f.operator })),
    { boneKey: state.filterBoneKey, operator: state.filterOperator },
  ]
  return !combinationCovered(prospective)
})

const canAddFilter = computed(() => {
  if (!state.filterBone) return false
  if (filterBoneType.value === "bool") return true
  return state.filterValue !== "" && state.filterValue !== null && state.filterValue !== undefined
})

function filterableField(bone) {
  if (!bone || !bone.indexed || !bone.visible) return false
  if (bone?.params?.filter === "no") return false
  return ["bool", "numeric", "date", "select", "str"].some((type) => (bone.type || "").startsWith(type))
}

function selectFilterBone(event) {
  const key = event.target.value
  if (!key) {
    clearFilterBone()
    return
  }
  const structure = getStructureFromSource()
  state.filterBoneKey = key
  state.filterBone = { ...(structure[key] || {}), key }
  state.filterOperator = "="
  state.filterValue = filterBoneType.value === "bool" ? false : ""
}

function clearFilterBone() {
  state.filterBoneKey = ""
  state.filterBone = null
  state.filterOperator = "="
  state.filterValue = ""
}

function updateFilterOperator(event) {
  state.filterOperator = event.target.value
}

function updateFilterValue(event) {
  state.filterValue = event.target.value
}

function updateFilterBool(event) {
  state.filterValue = event.target.checked
}

function addFilter() {
  if (!canAddFilter.value) return
  const operator = state.filterOperator
  const value = filterBoneType.value === "bool" ? state.filterValue === true : state.filterValue
  const filterKey = operator === "=" ? state.filterBoneKey : `${state.filterBoneKey}${operator}`
  const descr = state.filterBone?.descr || state.filterBoneKey
  const opLabel = filterOperators.value.find((op) => op.value === operator)?.label || operator

  state.filters = state.filters.filter((f) => f.filterKey !== filterKey)
  state.filters = state.filters.concat({
    filterKey,
    boneKey: state.filterBoneKey,
    operator,
    value,
    name: `${descr} ${opLabel} ${value}`,
  })

  clearFilterBone()
}

function removeFilter(filterKey) {
  state.filters = state.filters.filter((f) => f.filterKey !== filterKey)
}

function buildFilterParams() {
  return state.filters.reduce((params, f) => {
    params[f.filterKey] = f.value
    return params
  }, {})
}

// A server error (500) while filters are active typically means the datastore has no
// index for this filter combination. Surface a comprehensible message instead of the raw error.
function resolveErrorMessage(error) {
  if (error?.statusCode >= 500 && state.filters.length > 0) {
    return t("export.filter.unsupportedCombination")
  }
  return error?.message || t("error")
}

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
  const sourceParams = { ...cloneParams(sourceList?.state?.params || {}), ...buildFilterParams() }
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
    state.error = resolveErrorMessage(error)
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
  state.filters = []
  clearFilterBone()
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
    state.error = resolveErrorMessage(error)
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
    state.filters.map((f) => `${f.filterKey}=${f.value}`).join("|"),
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

.preview-loading {
  display: flex;
  align-items: center;
  gap: var(--sl-spacing-small);
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

.filter-builder {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sl-spacing-small);
}

.filter-builder sl-select,
.filter-builder sl-input {
  min-width: 140px;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sl-spacing-x-small);
  margin-top: var(--sl-spacing-small);
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
