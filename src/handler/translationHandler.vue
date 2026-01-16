<template>
  <div ref="cmenu" popover class="cmenu">
    <sl-menu style="max-width: 200px">
      <sl-menu-item value="copy">
        <sl-copy-button :value="state.cellvalues['rendered']" hoist :title="$t('listhandler.copy_value')">
          <sl-icon slot="copy-icon" name="copy"></sl-icon>
        </sl-copy-button>
      </sl-menu-item>
    </sl-menu>
  </div>
  <div class="main-wrapper">
    <handler-bar v-if="!noTopbar" :module="module" handler="listhandler"></handler-bar>
    <sl-details
      v-if="modulesStore.state.loaded && modulesStore.state.modules[module]?.['help_text']"
      open
      summary="Modul Info"
    >
      <div v-html="modulesStore.state.modules[module]['help_text']"></div>
    </sl-details>

    <div class="table-wrapper" @scroll="stickyHeader">
      <loader v-if="currentlist.state.state === 0" size="3"></loader>
      <div style="float: right; margin-right: 10px">
        <div style="display: flex; flex-direction: row; gap: 10px; align-items: center">
          <handler-context></handler-context>
        </div>
      </div>

      <table ref="translationTable">
        <thead>
          <tr>
            <th>Schlüssel</th>
            <th>Deutsch</th>
            <th :key="`header-${state.selectedLanguage}`">{{ state.languageColumnLabel }}</th>
            <th>Fallback</th>
            <th>Status</th>
            <th>Public</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(skel, idx) in currentlist.state.skellist"
            :key="skel.key || idx"
            :class="{ selected: state.selectedRows.includes(idx), 'is-hidden': !state.renderedList[idx]['_visible'] }"
            :style="state.renderedList[idx]['_style']"
            @dblclick="primaryAction"
            @click.exact="entrySelected(idx)"
            @click.ctrl="entrySelected(idx, 'append')"
            @click.shift="entrySelected(idx, 'range')"
          >
            <td @contextmenu.prevent="contextMenu($event, idx, 'tr_key', getTranslationKey(skel))">
              {{ getTranslationKey(skel) }}
            </td>
            <td @contextmenu.prevent="contextMenu($event, idx, 'de', getTranslationValue(skel, 'de'))">
              <div class="translation-cell">
                <sl-textarea
                  class="translation-input"
                  size="small"
                  resize="auto"
                  rows="1"
                  :value="getTranslationValue(skel, 'de')"
                  @sl-input="updateLocalTranslation(skel, 'de', $event.target.value)"
                  @sl-change="commitTranslation(skel, 'de', $event.target.value)"
                ></sl-textarea>
                <div class="translation-status-overlay">
                  <sl-spinner v-if="isSavingTranslation(skel, 'de')" style="font-size: 14px"></sl-spinner>
                  <sl-icon
                    v-else-if="isTranslationStatus(skel, 'de', 'success')"
                    name="check2-circle"
                    style="color: var(--sl-color-success-600)"
                  ></sl-icon>
                  <sl-icon
                    v-else-if="isTranslationStatus(skel, 'de', 'error')"
                    name="x-circle"
                    style="color: var(--sl-color-danger-600)"
                  ></sl-icon>
                </div>
              </div>
            </td>
            <td
              @contextmenu.prevent="
                contextMenu($event, idx, state.selectedLanguage, getTranslationValue(skel, state.selectedLanguage))
              "
              :key="`translation-${state.selectedLanguage}`"
            >
              <div class="translation-cell">
                <sl-textarea
                  :key="`textarea-${state.selectedLanguage}`"
                  class="translation-input"
                  size="small"
                  resize="auto"
                  rows="1"
                  :value="getTranslationValue(skel, state.selectedLanguage)"
                  @sl-input="updateLocalTranslation(skel, state.selectedLanguage, $event.target.value)"
                  @sl-change="commitTranslation(skel, state.selectedLanguage, $event.target.value)"
                ></sl-textarea>
                <div class="translation-status-overlay">
                  <sl-spinner v-if="isSavingTranslation(skel, state.selectedLanguage)" style="font-size: 14px"></sl-spinner>
                  <sl-icon
                    v-else-if="isTranslationStatus(skel, state.selectedLanguage, 'success')"
                    name="check2-circle"
                    style="color: var(--sl-color-success-600)"
                  ></sl-icon>
                  <sl-icon
                    v-else-if="isTranslationStatus(skel, state.selectedLanguage, 'error')"
                    name="x-circle"
                    style="color: var(--sl-color-danger-600)"
                  ></sl-icon>
                </div>
              </div>
            </td>
            <td @contextmenu.prevent="contextMenu($event, idx, 'fallback', getFallbackValue(skel))">
              {{ getFallbackValue(skel) || '—' }}
            </td>
            <td>
              <sl-badge :variant="isTranslationComplete(skel) ? 'success' : 'warning'" pill class="status-badge">
                {{ isTranslationComplete(skel) ? "Vollständig" : formatMissingLanguages(skel) }}
              </sl-badge>
            </td>
            <td>
              <sl-badge :variant="skel.public ? 'success' : 'neutral'" pill>
                {{ skel.public ? "Public" : "Private" }}
              </sl-badge>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="state.emptyList" class="empty-message">
        <sl-alert variant="info" open class="alert">
          <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
          <strong>Keine Einträge</strong>
        </sl-alert>
      </div>
    </div>
    <floating-bar></floating-bar>
  </div>
</template>

<script setup>
import {
  reactive,
  computed,
  provide,
  onMounted,
  onUnmounted,
  ref,
  watch,
  onActivated,
  onDeactivated,
  unref,
  toRaw,
} from "vue"
import HandlerBar from "../bars/HandlerBar.vue"
import { ListRequest, Request, destroyStore } from "@viur/vue-utils"
import { useDBStore } from "../stores/db"
import { useMessageStore } from "../stores/message"
import { useModulesStore } from "../stores/modules"
import { useRoute, useRouter } from "vue-router"
import Loader from "@viur/vue-utils/generic/Loader.vue"
import FloatingBar from "../bars/FloatingBar.vue"
import { useContextStore } from "../stores/context"
import { useLocalStore } from "../stores/local"
import HandlerContext from "../main/context/HandlerContext.vue"
import { useCachedRequestsStore } from "@viur/vue-utils/utils/request"
import { useUserStore } from "@viur/vue-utils/login/stores/user"
import Utils from "../utils"

const props = defineProps({
  module: {
    type: String,
    required: true,
  },
  group: String,
  view: null,
  rowselect: {
    default: 2, //0 == disabled, 1==select One, 2: select multiple
  },
  selector: false,
  filter: {},
  noTopbar: false,
  columns: {
    default: undefined,
  },
  inheritContext: {
    default: true,
  },
})
const emit = defineEmits(["currentSelection", "closeSelector"])

const dbStore = useDBStore()
const route = useRoute()
const router = useRouter()
const messageStore = useMessageStore()
const modulesStore = useModulesStore()
const contextStore = useContextStore()
const localStore = useLocalStore()
const userStore = useUserStore()

const cachedRequestsStore = useCachedRequestsStore()

const cmenu = ref(null)
const state = reactive({
  type: "listhandler",
  tabId: route.query?.["_"],
  storeName: computed(() => {
    let name = `module___${props.module}`
    if (props.view) {
      name += `___${props.view}`
    }
    name += `___${route.query["_"]}`

    return name
  }),
  currentSelection: [],
  module: computed(() => props.module),
  group: computed(() => props.group),
  view: computed(() => props.view),
  active: false,
  conf: {},
  selectedRows: [],
  sticky: false,
  renderedList: computed(() => {
    return currentlist.state.skellist.map((skel) => ({
      _visible: true,
      _style: skel["_style"] || {},
    }))
  }),
  emptyList: computed(() => {
    if (state.renderedList.length === 0 && currentlist.state.state > 0) {
      return true
    }

    if (state.renderedList.filter((x) => x["_visible"]).length === 0) {
      return true
    }
    return false
  }),
  canEdit: computed(() => {
    if (state.conf?.["disabledActions"]?.includes("edit")) return false
    if (userStore.state.user.access.indexOf("root") !== -1) {
      return true
    }
    if (state.group) {
      return userStore.state.user.access.indexOf(`${state.module}-${state.group}-edit`) > -1
    } else {
      return userStore.state.user.access.indexOf(`${state.module}-edit`) > -1
    }
  }),
  cellvalues: { rendered: "" },
  columnWidths: {},
  selectedLanguage: null,
  availableLanguages: computed(() => currentlist.structure?.translations?.languages || []),
  selectableLanguages: computed(() => state.availableLanguages.filter((lang) => lang !== "de")),
  languageColumnLabel: computed(() => {
    if (!state.selectedLanguage) {
      return "Übersetzung"
    }
    return `Übersetzung (${state.selectedLanguage.toUpperCase()})`
  }),
})
provide("handlerState", state)
const currentlist = ListRequest(state.storeName, {
  module: props.module,
  params: {},
  group: props.group,
  renderer: "vi",
  cached: localStore.state.cache,
})

dbStore.setListStore(currentlist) //backup access

function reloadAction() {
  currentlist.state.cached = localStore.state.cache
  currentlist.reset()
  let ctx = {}
  if (props.inheritContext) {
    ctx = contextStore.getContext(state.tabId) //add local context && global Context
  } else {
    ctx = contextStore.getContext() // only global context
  }

  currentlist.state.params = { ...currentlist.state.params, ...ctx, ...props.filter }
  return currentlist
    .fetch()
    .catch((error) => {
      if (error.statusCode && typeof error !== "string") {
        messageStore.addMessage("error", `${error.message}`, error.response?.url)
      }
    })
    .then((resp) => {
      messageStore.addMessage("success", `Reload`, "Liste neu geladen")
    })
}

provide("reloadAction", reloadAction)

function updateAction() {
  return reloadAction()
}

provide("updateAction", updateAction)

function setLimit(limit) {
  currentlist.state.params["limit"] = limit
  currentlist.reset()
  currentlist.fetch()
}
provide("setLimit", setLimit)

onMounted(() => {
  state.selectedLanguage = state.selectableLanguages[0] || state.availableLanguages[0] || "de"
  state.conf = dbStore.getConf(props.module, props.view)
  if (state.conf) {
    if (Object.keys(state.conf).indexOf("filter") > -1) {
      for (const key in state.conf["filter"]) {
        currentlist.state.params[key] = state.conf["filter"][key]
      }
    }
    if (state.conf?.["context"]) {
      for (const key in state.conf["context"]) {
        currentlist.state.params[key] = state.conf["context"][key]
      }
    }
  }

  let ctx = {}
  if (props.inheritContext) {
    ctx = contextStore.getContext(state.tabId) //add local context && global Context
  } else {
    ctx = contextStore.getContext() // only global context
  }

  currentlist.state.params = { ...currentlist.state.params, ...ctx, ...props.filter }
  currentlist.state.params["limit"] = localStore.state.listamount
  currentlist
    .fetch()
    .catch((error) => {
      if (error.statusCode && typeof error !== "string") {
        messageStore.addMessage("error", `${error.message}`, error.response.url)
      }
    })
})

onActivated(() => {
  state.active = true
  let tabData = dbStore.getTabById(route.query["_"])

  if (tabData?.["update"]) {
    reloadAction()
    tabData["update"] = false
  }
})

watch(
  () => Object.values(contextStore.state.globalContext),
  (newVal, oldVal) => {
    reloadAction()
  }
)

onDeactivated(() => {
  state.active = false
})

onUnmounted(() => {
  destroyStore(currentlist)
})

watch(
  () => state.availableLanguages,
  (langs) => {
    if (!langs || langs.length === 0) {
      state.selectedLanguage = null
      return
    }
    if (!state.selectedLanguage || !langs.includes(state.selectedLanguage)) {
      state.selectedLanguage = langs.find((lang) => lang !== "de") || langs[0]
    }
  }
)

function entrySelected(idx, action = "replace") {
  if (action === "append" && props.rowselect > 1) {
    if (state.selectedRows.includes(idx)) {
      state.selectedRows.splice(state.selectedRows.indexOf(idx), 1)
    } else {
      state.selectedRows.push(idx)
    }
  } else if (action === "range" && props.rowselect > 1) {
    let lastEntry = state.selectedRows[state.selectedRows.length - 1]
    let end = idx
    let start = lastEntry
    if (lastEntry > idx) {
      //selection is smaller than last number
      start = idx
      end = lastEntry
    }
    state.selectedRows = state.selectedRows.concat(new Array(end + 1 - start).fill().map((d, i) => i + start))
  } else if (props.rowselect > 0) {
    state.selectedRows = [idx]
  }

  state.selectedRows = [...new Set(state.selectedRows)] // remove duplicates and sort

  state.currentSelection = currentlist.state.skellist.filter((entry, idx) => state.selectedRows.includes(idx))
  const currentSelection = []
  for (const selection of state.currentSelection) {
    currentSelection.push(toRaw(selection))
  }
  contextStore.setContext("_selectedEntries", currentSelection, state.tabId) //set private Context for scriptor
  if (state.currentSelection.length > 0) {
    dbStore.state["skeldrawer.entry"] = state.currentSelection[0]
    dbStore.state["skeldrawer.structure"] = currentlist.structure
  }

  emit("currentSelection", state.currentSelection)
}

function openEditor(e) {
  if (props.selector) {
    emit("closeSelector", state.currentSelection)
    return 0
  }
  let url = `/db/${state.module}/edit/${state.currentSelection[0]["key"]}`
  if (state.group) {
    url = `/db/${state.module}/edit/${state.group}/${state.currentSelection[0]["key"]}`
  }
  if (dbStore.state["editor.url"][state.module]) {
    const customUrl = dbStore.state["editor.url"][state.module]

    if (typeof customUrl === "function") {
      url = customUrl(url)
    } else {
      url = customUrl
    }
  }
  let route = router.resolve(unref(url))
  dbStore.addOpened(route, state.module, state.view, Utils.extractNamefromSkel(state.currentSelection[0]))
}

function primaryAction(e) {
  if (!props.selector && state.conf["handler"].startsWith("list.fluidpage")) {
    let conf = dbStore.getConf(state.module)
    let module = conf["handler"].split(".").at(-1).replace("/", ".")
    let url = `/db/${module}/fluidpage/${state.module}/${state.currentSelection[0]["key"]}`
    let route = router.resolve(unref(url))
    contextStore.setContext("fluidpage.dest.key", state.currentSelection[0]["key"], state.tabId)
    contextStore.setContext("fluidpage", state.currentSelection[0]["key"], state.tabId)
    dbStore.addOpened(route, module, null, state.currentSelection[0]["name"])
    return 0
  }

  openEditor(e)
}

function nextpage() {
  return currentlist.next()
}

provide("nextpage", nextpage)
provide("currentlist", currentlist)

function stickyHeader(e) {
  if (e.target.scrollTop > 10) {
    state.sticky = true
  } else {
    state.sticky = false
  }
}


function contextMenu(e, idx, name, rendered) {
  state.cellvalues = { idx: idx, name: name, rendered: rendered }
  cmenu.value.style.left = e.clientX + "px"
  cmenu.value.style.top = e.clientY + "px"

  cmenu.value.showPopover()
}

function updateLocalTranslation(skel, lang, value) {
  if (!skel || !lang) return
  const translations = { ...getTranslationsObject(skel) }
  translations[lang] = value
  skel.translations = translations
  skel[lang] = value
  skel[`translation_${lang}`] = value
}

function commitTranslation(skel, lang, value) {
  if (!skel || !lang) return
  updateLocalTranslation(skel, lang, value)
  toggleSaving(skel, lang, true)
  const entryKey = skel.key
  const translations = { ...getTranslationsObject(skel), [lang]: value }
  const dataObj = {}
  for (const [tLang, tVal] of Object.entries(translations)) {
    dataObj[`translations.${tLang}`] = tVal
  }
  Request.edit(currentlist.state.module, entryKey, {
    dataObj,
    group: state.group,
    renderer: currentlist.state.renderer,
  })
    .then(async () => {
      cachedRequestsStore.clearCache(Request.buildUrl(`/${currentlist.state.renderer}/${currentlist.state.module}`))
      setTranslationStatus(skel, lang, "success")
    })
    .catch(() => {
      /* keep optimistic UI even if request fails; caller can reload */
      setTranslationStatus(skel, lang, "error")
    })
    .finally(() => toggleSaving(skel, lang, false))
}

function getTranslationsObject(skel) {
  if (!skel) return {}
  return skel.translations || {}
}

function getTranslationValue(skel, lang) {
  if (!skel || !lang) return ""
  const translations = getTranslationsObject(skel)
  return translations[lang] ?? ""
}

function getTranslationKey(skel) {
  if (!skel) return ""
  return skel.tr_key
}

function getFallbackValue(skel) {
  if (!skel) return ""
  return skel.default_text || ""
}

function missingLanguages(skel) {
  if (!skel) return []
  return Array.isArray(skel.translations_missing)
    ? skel.translations_missing
    : skel.translations_missing
    ? [skel.translations_missing].flat()
    : []
}

function isTranslationComplete(skel) {
  const missing = missingLanguages(skel)
  if (missing.length > 0) return false
  if (!state.availableLanguages || state.availableLanguages.length === 0) return true
  return state.availableLanguages.every((lang) => {
    const val = getTranslationValue(skel, lang)
    return val !== undefined && val !== null && String(val).trim() !== ""
  })
}

function formatMissingLanguages(skel) {
  const missing = missingLanguages(skel)
  if (missing.length === 0) return "Unvollständig"
  return `Fehlt: ${missing.join(", ")}`
}

function languageLabel(lang) {
  if (!lang) return ""
  return lang.toUpperCase()
}

const savingTranslations = reactive({})
function savingKey(skel, lang) {
  return `${skel?.key}-${lang}`
}

function toggleSaving(skel, lang, value) {
  const key = savingKey(skel, lang)
  savingTranslations[key] = value
}

function isSavingTranslation(skel, lang) {
  const key = savingKey(skel, lang)
  return !!savingTranslations[key]
}

const translationStatus = reactive({})
const translationStatusTimers = {}
function setTranslationStatus(skel, lang, status) {
  const key = savingKey(skel, lang)
  translationStatus[key] = status
  if (translationStatusTimers[key]) {
    clearTimeout(translationStatusTimers[key])
  }
  translationStatusTimers[key] = setTimeout(() => {
    delete translationStatus[key]
    delete translationStatusTimers[key]
  }, 3000)
}

function isTranslationStatus(skel, lang, status) {
  const key = savingKey(skel, lang)
  return translationStatus[key] === status
}
</script>

<style scoped>
.cmenu {
  background: transparent;
  sl-menu {
    background-color: var(--sl-color-neutral-50);
  }
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 0;
  position: relative;
  width: 100%;
}

.loader {
  position: absolute;
  width: 100%;
  height: 50%;
}

.ellipsis {
  display: -webkit-box;
  text-overflow: ellipsis;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sort-active {
  opacity: 1 !important;
}

.sort-arrow {
  cursor: pointer;
  width: 100%;
  height: 100%;
  padding: 25%;
  opacity: 0;

  &.sort-down {
    transform: rotate(90deg);
  }

  &.sort-up {
    transform: rotate(-90deg);
  }
}

.sort-arrow-wrap {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 1.5em;
  height: 1.5em;
  position: absolute;
  right: 0.6em;

  &:hover .sort-arrow {
    opacity: 1 !important;
  }
}

table {
  width: 100%;
  table-layout: fixed;

  & tbody {
    & tr {
      cursor: pointer;
      transition: all ease 0.3s;
      -webkit-user-select: none; /* For Safari */
      -ms-user-select: none; /* For Internet Explorer */
      user-select: none; /* Standard syntax */

      & td {
        padding: 0.4em 0.6em;
        overflow: hidden;
        word-wrap: break-word;
        border-right: 1px solid var(--sl-color-neutral-300);
        border-bottom: 1px solid var(--sl-color-neutral-300);

        &:last-child {
          border-right: 0;
        }
      }

      &:nth-child(even) {
        background-color: var(--sl-color-neutral-100);
      }

      &:hover {
        background-color: var(--sl-color-neutral-200);
      }
    }

    & tr.selected {
      background-color: var(--sl-color-neutral-300);

      td {
        font-weight: 700;
      }
    }
  }

  & thead {
    & th {
      position: relative;
      padding: 0.4em 2.4em 0.4em 0.6em;
      resize: horizontal;
      overflow: hidden;
      background: linear-gradient(
        var(--vi-background-color) 0%,
        var(--vi-background-color) calc(100% - 2px),
        var(--sl-color-neutral-700) 100%
      );
      font-weight: 700;
      border-right: 1px solid var(--sl-color-neutral-300);
      text-overflow: ellipsis;

      &:last-child {
        border-right: 0;
      }

      &::-webkit-resizer {
        border-color: transparent;
        display: block;
      }

      &:after {
        content: "";
        border-style: solid;
        border-width: 0 0 12px 12px;
        border-color: transparent transparent var(--sl-color-neutral-200) transparent;
        z-index: 1;
        position: absolute;
        right: 0;
        bottom: 2px;
        pointer-events: none;
      }

      &:hover {
        .sort-arrow-wrap .sort-arrow {
          opacity: 0.4;
        }

        &:after {
          border-color: transparent transparent var(--sl-color-neutral-700) transparent;
        }
      }
    }
  }
}

.table-wrapper {
  color: var(--vi-foreground-color);
  overflow: auto;
  flex: 1;
  padding-bottom: 80px;
}
.stick-header {
  position: sticky;
  top: 0;
}

sl-details {
  &::part(prefix) {
    display: none;
  }

  &::part(header) {
    font-weight: bold;
    padding: var(--sl-spacing-small) var(--sl-spacing-medium);
  }

  &::part(content) {
    padding: 0 var(--sl-spacing-medium) var(--sl-spacing-small) var(--sl-spacing-medium);
  }

  &::part(base) {
    font-size: 0.95em;
    border: none;
    border-radius: 0;
    border-bottom: 1px solid var(--vi-border-color);
  }
}

.empty-message {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  overflow: hidden;
  justify-content: center;
  padding: 20px 20px 15px 20px;
}

.translation-input {
  width: 100%;
}

.translation-cell {
  position: relative;
}

.translation-status-overlay {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  pointer-events: none;
}

.status-badge[variant="warning"]::part(base) {
  color: var(--sl-color-neutral-900);
}
</style>
