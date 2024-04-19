<template>
  <div class="wrap-for-popup">
    <div
      v-if="!noTopbar"
      class="topbar"
    >
      <div class="top-headline">
        <span v-if="['clone', 'add'].includes(action)">Neuer</span>
        <span v-else-if="['edit'].includes(action)">Bearbeite</span>
        {{ state.conf?.["name"] }} Eintrag
        <span v-if="state.formValues?.['name']?.[0]['name']">: {{ Utils.unescape(state.formValues["name"][0]["name"]) }}</span>
      </div>
      <entry-bar
        :module="module"
        :action="action"
        :skelkey="skelkey"
        skeltype="skeltype"
      ></entry-bar>
    </div>
    <loader
      v-if="state.loading"
      size="3"
    ></loader>
    <sl-details
      v-if="modulesStore.state.loaded && modulesStore.state.modules[module]?.[`help_text_${action}`]"
      open
      summary="Info"
    >
      <p v-html="modulesStore.state.modules[module][`help_text_${action}`]"></p>
    </sl-details>

    <div
      v-if="!state.loading"
      class="scroll-content"
    >
      <template
        v-for="(group, key) in state.formGroups"
        :key="key"
      >
        <sl-details
          v-show="group['groupVisible']"
          :summary="group['name']"
          :open="group['groupOpen']"
        >
          <template
            v-for="bone in group['bones']"
            :key="bone['name']"
          >
            <bone
              :is="getBoneWidget(state.structure[bone['boneName']]['type'])"
              v-show="state.structure[bone['boneName']]['visible']"
              :name="bone['boneName']"
              :structure="state.structure"
              :skel="state.skel"
              :errors="state.errors"
              @change="updateValue"
            >
            </bone>
          </template>
        </sl-details>
      </template>

      <template v-for="handler in state.conf?.['editViews']">
        <sl-details
          v-if="skelkey"
          :summary="handler['name'] || dbStore.getConf(handler['module'])?.['name'] || handler['module']"
          :open="false"
        >
          <div class="embeded-list">
            <component
              :is="getEditView(handler)['handlerComponent']"
              :module="handler['module']"
              :group="handler['group']"
              :columns="handler?.['columns'] ? handler['columns'] : []"
              :filter="editViewFilter(handler)"
            >
            </component>
          </div>
        </sl-details>
      </template>

      <template v-if="appStore.state.debug">
        <sl-details summary="DEBUG: Formdata">
          <VueJsonPretty
            :deep="1"
            :data="state.formValues"
          ></VueJsonPretty>
        </sl-details>
        <sl-details summary="DEBUG: Errors">
          {{ state.errors }}
        </sl-details>
      </template>
    </div>
    <template v-if="state.relation_opened">
      <template v-for="bone in state.relation_opened">
        <sl-dialog
          open
          style="--width: 85%"
          class="relation-popup"
          :label="'Auswahl: ' + bone['boneStructure']['descr']"
          @sl-request-close="relationCloseAction($event)"
        >
          <component
            :is="bone['bone_conf']['handlerComponent']"
            :rowselect="1"
            :module="bone['boneStructure']['module']"
            @currentSelection="relationUpdateSelection($event, bone)"
          >
          </component>
          <div
            slot="footer"
            class="footer"
          >
            <sl-button
              variant="danger"
              size="small"
              outline
              @click="relationRemoveHandler(bone)"
              >{{ $t("relation.abort") }}</sl-button
            >
            <sl-button
              :disabled="!bone['currentSelection'] || bone['currentSelection']?.length === 0"
              variant="success"
              size="small"
              @click="relationApplySelection(bone)"
            >
              {{ $t("relation.select") }}
            </sl-button>
          </div>
        </sl-dialog>
      </template>
    </template>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import { reactive, defineComponent, onBeforeMount, computed, provide, toRaw, unref, watch, onActivated } from "vue"
import { Request } from "@viur/vue-utils"
import { useDBStore } from "../stores/db"
import { useLocalStore} from "../stores/local"
import { useContextStore } from "../stores/context"
import { useRoute } from "vue-router"
import { useMessageStore } from "../stores/message"
import { useUserStore } from "@viur/vue-utils/login/stores/user"
import EntryBar from "../bars/EntryBar.vue"
import { useModulesStore } from "../stores/modules"
import handlers from "../handler/handlers"
import bone from "@viur/vue-utils/bones/edit/bone.vue"
import { getBoneWidget } from "@viur/vue-utils/bones/edit/index"
import Loader from "@viur/vue-utils/generic/Loader.vue"
import { useAppStore } from "../stores/app"
import VueJsonPretty from "vue-json-pretty"
import "vue-json-pretty/lib/styles.css"
import Logics from "logics-js"
import Utils from "../utils"

export default defineComponent({
  props: {
    module: {
      type: String,
      required: true
    },
    action: null,
    group: null,
    skelkey: null,
    skeltype: null,
    noTopbar: false,
    secure: {
      type: Boolean,
      default: true
    },
    bones: {
      type: Array,
      default: []
    },
    values: {
      type: Object,
      default: null
    },
    renderer: {
      type: String,
      default: import.meta.env.VITE_DEFAULT_RENDERER || "vi"
    },
    errors: []
  },
  components: { EntryBar, bone, ...handlers, VueJsonPretty, Loader },
  emit: ["change"],
  setup(props, context) {
    const dbStore = useDBStore()
    const appStore = useAppStore()
    const contextStore = useContextStore()
    const route = useRoute()
    const modulesStore = useModulesStore()
    const messageStore = useMessageStore()
    const localStore = useLocalStore()
    const userStore = useUserStore()
    const values = reactive({})
    const state = reactive({
      type: "formhandler",
      skel: {},
      structure: {},
      errors: [],
      conf: computed(() => {
        return dbStore.getConf(props.module)
      }),
      tabId: route.query?.["_"],
      formGroups: computed(() => {
        let groups = { default: { name: "Allgemein", bones: [], groupVisible: false, groupOpen: true } }
        for (const [boneName, bone] of Object.entries(state.structure)) {
          if (props.bones.length > 0) {
            if (!props.bones.includes(boneName)) {
              continue
            }
          }

          let category = "default"
          let boneStructure = state.structure[boneName]
          let boneValue = state.skel[boneName]
          if (bone?.params?.category) {
            category = bone.params.category.toLowerCase()
          }

          if (Object.keys(groups).includes(category)) {
            groups[category]["bones"].push({
              boneName: boneName,
              boneStructure: boneStructure,
              boneValue: boneValue
            })
          } else {
            groups[category] = {
              name: bone.params.category,
              bones: [
                {
                  boneName: boneName,
                  boneStructure: boneStructure,
                  boneValue: boneValue
                }
              ]
            }
          }
          if (boneStructure["visible"] === true) {
            groups[category]["groupVisible"] = true
          }
          if (
            (state.conf?.["collapsedCategories"] &&
              state.conf["collapsedCategories"].map((x) => x.toLowerCase()).includes(category)) ||
            category === "system" ||
            state.conf?.["collapsedCategories"]?.[0] === "*"
          ) {
            groups[category]["groupOpen"] = false
          } else {
            groups[category]["groupOpen"] = true
          }
        }
        let sortedGroups = {}
        Object.keys(groups)
          .sort()
          .forEach(function (key) {
            sortedGroups[key] = groups[key]
          })

        return sortedGroups
      }),
      formValues: {},
      module: props.module,
      action: props.action,
      group: props.group,
      skelkey: props.skelkey,
      skeltype: props.skeltype,
      renderer: computed(() => props.renderer),
      relation_opened: [],
      loading: false
    })
    provide("handlerState", state)

    function structureToDict(structure: object) {
      if (Array.isArray(structure)) {
        let struct = {}
        for (const idx in structure) {
          struct[structure[idx][0]] = structure[idx][1]
        }
        return struct
      } else {
        return structure
      }
    }

    function fetchData() {
      state.loading = true
      let url = `/${props.renderer}/${props.module}/${props.action === "clone" ? "edit" : props.action}`
      if (props.group) url += `/${props.group}`

      if (props.action === "edit" || props.action === "clone") {
        if (state.skeltype === "node") {
          url += `/node`
        } else if (state.skeltype === "leaf") {
          url += `/leaf`
        }
        url += `/${props.skelkey}`
      }
      let dataObj = {}
      if (state.skeltype === "node" && props.action === "add") {
        url += `/node`
        dataObj["node"] = props.skelkey
      }

      if (state.skeltype === "leaf" && props.action === "add") {
        url += `/leaf`
        dataObj["node"] = props.skelkey
      }
      let requestHandler = Request.post
      if (props.secure) {
        requestHandler = Request.securePost
      }

      dataObj = { ...dataObj, ...contextStore.getContext(state.tabId) }

      requestHandler(url, { dataObj: dataObj }).then(async (resp) => {
        let data = await resp.json()

        if (data["status"] && data["status"] !== 200) {
          let txt = data["descr"]
          //todo sl-details format traceback
          /*if (userStore.userAccess.includes("root")) {
            txt += "\n" + data["traceback"]
          }*/
          messageStore.addMessage("error", data["title"], txt)
          state.loading = false
          return
        }

        if (props.values) {
          for (const [key, val] of Object.entries(props.values)) {
            data["values"][key] = val
          }
        }

        for (const [key, val] of Object.entries(route.query)) {
          if (Object.keys(data["values"]).includes(key)) {
            data["values"][key] = val
          } else if (key.includes(".")) {
            let keyArr = key.split(".")
            const bonename = keyArr[0]
            const lastelement = keyArr.pop()
            let newVal = { [lastelement]: val }
            for (let element of keyArr.slice(1).reverse()) {
              newVal = { [element]: newVal }
            }
            data["values"][bonename] = newVal
          }
        }

        state.skel = data["values"]
        state.structure = structureToDict(data["structure"])
        state.errors = data["errors"]
        state.loading = false

        if (props.action === "edit") {

          let data = {...state.conf}
          data['key'] = state.skel['key']
          if (Object.keys(state.skel).includes('name')){
            data['name'] = state.skel['name']
          }
          data["to"] = {...route}
          localStore.addEntries(data)
        }
      })
    }
    provide("fetchData", fetchData)

    function getWidget(boneName: string) {
      let widget = "base_item"
      if (state.structure != null && state.structure[boneName] != null && state.structure[boneName]["type"] != null) {
        const typeName = state.structure[boneName]["type"].replace(/\./g, "_")
        if (Object.keys(bones).includes(typeName)) {
          widget = typeName
        }
      }
      return widget
    }

    function updateValue(data) {
      state.formValues[data.name] = data.value
      if (data.name === "name") {
        if (data.lang) {
          dbStore.updateActiveTabName(data.value[0][Object.keys(data.value[0])[0]])
        } else {
          dbStore.updateActiveTabName(data.value[0]["name"])
        }
      }

      visibleIf(data)
      readonlyIf(data)
      context.emit("change", state.formValues)
    }

    function relationSelection(event, bone) {
      bone["bone_instance"] = event.target
      bone["bone_instance_boneName"] = event["detail"]["boneName"]
      bone["bone_conf"] = dbStore.getConf(bone["boneStructure"]["module"])

      state.relation_opened.push(bone)
    }

    function relationUpdateSelection(event, bone) {
      bone["currentSelection"] = event
    }

    function relationApplySelection(bone) {
      for (let skel of bone["currentSelection"]) {
        bone["bone_instance"].addRelation(toRaw(skel), bone["bone_instance_boneName"])
      }
      relationRemoveHandler(bone)
    }

    function relationCloseAction(event, bone) {
      if (event.detail.source === "overlay") {
        event.preventDefault()
        return 0
      }
      relationRemoveHandler(bone)
    }

    function relationRemoveHandler(bone) {
      state.relation_opened = state.relation_opened.filter((i) => i !== bone)
    }

    function visibleIf(changeddata) {
      try {
        // we need more stable skel updates for logics
        if (state.structure?.[changeddata["name"]]["multiple"]) {
          state.skel[changeddata["name"]] = changeddata["value"].map((x) => x[changeddata["name"]])
        } else {
          state.skel[changeddata["name"]] = [changeddata["value"][0][changeddata["name"]]]
        }
      } catch (e) {}

      for (const [boneName, bone] of Object.entries(state.structure)) {
        if (bone?.["params"]?.["visibleIf"]) {
          let ex = new Logics(bone?.["params"]?.["visibleIf"])
          bone["visible"] = ex.run(state.skel).toBool()
        }
      }
    }

    function readonlyIf(changeddata) {
      try {
        // we need more stable skel updates for logics
        if (state.structure?.[changeddata["name"]]["multiple"]) {
          state.skel[changeddata["name"]] = changeddata["value"].map((x) => x[changeddata["name"]])
        } else {
          state.skel[changeddata["name"]] = [changeddata["value"][0][changeddata["name"]]]
        }
      } catch (e) {}

      for (const [boneName, bone] of Object.entries(state.structure)) {
        if (bone?.["params"]?.["readonlyIf"]) {
          let ex = new Logics(bone?.["params"]?.["readonlyIf"])
          bone["readonly"] = ex.run(state.skel).toBool()
        }
      }
    }

    function editViewFilter(handler) {
      let filter = {}
      if (handler["filter"]) {
        filter = handler["filter"]
      }

      //todo set Context on routing
      if(typeof handler["context"] === 'object'){
        for (const [k, v] of Object.entries(handler["context"])) {
          if (Object.keys(state.skel).includes(v)) {
            contextStore.setContext(k, state.skel[v], state.tabId)
            filter[k] = state.skel[v]
          }
        }
      } else {
        filter[handler["context"]] = props.skelkey
        contextStore.setContext(handler["context"], props.skelkey, state.tabId)
      }

      return filter
    }

    function getEditView(handler) {
      let currentModule = dbStore.getConf(handler["module"])
      return currentModule
    }

    onBeforeMount(() => {
      fetchData()
    })

    watch(
      () => props.errors,
      (newVal, oldVal) => {
        state.errors = props.errors
      }
    )

    return {
      state,
      values,
      Utils,
      editViewFilter,
      getWidget,
      updateValue,
      modulesStore,
      appStore,
      dbStore,
      relationSelection,
      toRaw,
      relationCloseAction,
      relationUpdateSelection,
      relationApplySelection,
      relationRemoveHandler,
      getBoneWidget,
      fetchData,
      visibleIf,
      getEditView
    }
  }
})
</script>

<style scoped>
.split {
  flex: 1;
  height: 0;

  &::part(panel) {
    display: flex;
    flex-direction: column;
  }
}

.topbar {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: var(--sl-spacing-small);
  box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.25);
  z-index: 1;
}

.top-headline {
  margin-right: auto;
  color: var(--sl-color-primary-500);
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scroll-content {
  flex: 1;
  overflow-y: auto;
  position: relative;

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 3px;
  }

  &:hover {
    &::-webkit-scrollbar-thumb {
      background-color: #afafaf;
    }
  }
}

sl-details {
  &::part(prefix) {
    display: none;
  }

  &::part(base) {
    border-radius: 0;
    border-left: none;
    border-right: none;
    border-top: none;
    border-bottom: solid 1px var(--sl-color-neutral-300);
  }

  &::part(summary) {
    font-weight: 700;
  }
}

.footer {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
}

.wrap-for-popup {
  display: flex;
  flex-direction: column;
  flex: 1;
  position: relative;
}

.embeded-list {
  position: relative;
  min-height: 400px;

  :deep(.main-wrapper) {
    height: auto;

    max-height: calc(100vh - 170px);
  }

  :deep(.main) {
    height: auto;
  }
}
</style>
