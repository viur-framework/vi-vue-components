<template>
  <div class="wrap-for-popup">
    <sl-bar class="wrapper-action topbar">
        <div slot="left">
          <sl-spinner v-if="state.loading"></sl-spinner>
        </div>
        <div slot="right">
        <action-entry-bar
          :module="module"
          :action="action"
          :skelkey="skelkey"
          skeltype="skeltype"
        ></action-entry-bar>
      </div>
      </sl-bar>
    <div class="scroll-content">
      <vi-form ref="viform"
              :module="module"
              :action="action"
              :group="group"
              :skelkey="skelkey"
              :skeltype="skeltype"
              :values="values"
              :secure="secure"
              :renderer="renderer"
              :collapsedCategories="state.conf?.['collapsedCategories'] || []"
              :params="{ ...contextStore.getContext(state.tabId) }"
      >


      </vi-form>
      <template v-for="handler in state.conf?.['editViews']">

        <sl-details
          v-if="skelkey && viform && Object.keys(viform?.state?.skel).length>0"
          :summary="handler['name'] || dbStore.getConf(handler['module'])?.['name'] || handler['module']"
          :open="false"
        >
          <div class="embeded-list">
            <component
              :is="currentHandler(getEditView(handler))"
              :module="handler['module']"
              :group="handler?.['group']"
              :columns="handler?.['columns'] ? handler['columns'] : []"
              :filter="editViewFilter(handler)"
            >
            </component>
          </div>
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
            :is="currentHandler(bone['bone_conf']['handlerComponent'])"
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

<script setup>
import { reactive, defineComponent, onBeforeMount, computed, ref, provide, toRaw, unref, watch, onActivated } from "vue"
import { Request } from "@viur/vue-utils"
import { useDBStore } from "../stores/db"
import { useLocalStore} from "../stores/local"
import { useContextStore } from "../stores/context"
import { useRoute } from "vue-router"
import { useMessageStore } from "../stores/message"
import { useUserStore } from "@viur/vue-utils/login/stores/user"
import ActionEntryBar from "../bars/ActionEntryBar.vue"
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
import HandlerContext from "../main/context/HandlerContext.vue";
import ViForm from "@viur/vue-utils/forms/ViForm.vue"

function currentHandler(name){
  return handlers?.[name]?handlers[name]:name
}

  const props = defineProps({
    module: {
      type: String,
      required: true
    },
    view: null,
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
  })

  const emit = defineEmits( ["change"])
    const dbStore = useDBStore()
    const appStore = useAppStore()
    const contextStore = useContextStore()
    const route = useRoute()
    const modulesStore = useModulesStore()
    const messageStore = useMessageStore()
    const localStore = useLocalStore()
    const userStore = useUserStore()
    const state = reactive({
      type: "formhandler",
      skel: {},
      structure: {},
      errors: [],
      conf: computed(() => {
        return dbStore.getConf(props.module)
      }),
      tabId: route.query?.["_"],
      formValues: {},
      module: props.module,
      view: props.view,
      action: props.action,
      group: props.group,
      skelkey: props.skelkey,
      skeltype: props.skeltype,
      renderer: computed(() => props.renderer),
      relation_opened: [],
      loading: false
    })

    const viform = ref(null)
    provide("handlerState", state)
    provide("viform",viform)

    function fetchData(){
      viform.value.fetchData()
    }
    provide("fetchData",fetchData)

    function getWidget(boneName) {
      let widget = "base_item"
      if (state.structure != null && state.structure[boneName] != null && state.structure[boneName]["type"] != null) {
        const typeName = state.structure[boneName]["type"].replace(/\./g, "_")
        if (Object.keys(bones).includes(typeName)) {
          widget = typeName
        }
      }
      return widget
    }

    function reloadAction(){
      state.loading = true
      if (!viform.value) return
      return viform.value.fetchData().then(async (resp)=>{
        state.loading = false
        if (resp.status !== 200) {
            messageStore.addMessage("error", resp.statusText, resp.url)
        }
      }).catch(async (error)=>{
        messageStore.addMessage("error", `${error.message}`, error.response?.url)
      })
    }
    provide("reloadAction",reloadAction)

    function updateValue(data) {
      state.formValues[data.name] = data.value
      emit("change", state.formValues)
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

    function editViewFilter(handler) {
      let filter = {}
      if (handler["filter"]) {
        filter = handler["filter"]
      }
      if (!viform.value?.state?.skel) return filter

      //todo set Context on routing
      if(typeof handler["context"] === 'object'){
        for (const [k, v] of Object.entries(handler["context"])) {
          if (Object.keys(viform.value.state.skel).includes(v)) {
            contextStore.setContext(k, viform.value.state.skel[v], state.tabId)
            filter[k] = viform.value.state.skel[v]
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
      //fluidpage editview always use lists
      if (currentModule['handlerComponent'] === "fluidpagehandler"){
          return "listhandler"
      }
      return currentModule['handlerComponent']
    }

    watch(
      () => props.errors,
      (newVal, oldVal) => {
        state.errors = props.errors
      }
    )

    watch(()=>viform?.value?.state.loading, (newVal, oldVal)=>{
      state.loading = newVal
    })

</script>

<style scoped>
.wrapper-action{
  padding: 10px 20px;

}


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
