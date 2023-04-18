<template>

  <div class="topbar">

    <div class="top-headline">
      <span v-if="['clone', 'add'].includes(action)">Neuer</span>
      <span v-else-if="['edit'].includes(action)">Bearbeite</span>
      {{ state.conf?.['name'] }} Eintrag
      <span v-if="state.formValues?.['name']?.[0]['name']">: {{ state.formValues['name'][0]['name'] }}</span>
    </div>
    <entry-bar :module="module" :action="action" :skelkey="skelkey" skeltype="skeltype"
    ></entry-bar>

  </div>
  <sl-details open summary="Info"
              v-if="modulesStore.state.loaded && modulesStore.state.modules[module][`help_text_${action}`]">
    {{ modulesStore.state.modules[module][`help_text_${action}`] }}
  </sl-details>
  <div class="scroll-content">
    <template v-for="(group,key) in state.formGroups">
      <sl-details :summary="group['name']" v-show="group['groupVisible']" open>
        <template v-for="bone in group['bones']">
          <sl-bone
            :boneName="bone['boneName']"
            :boneStructure="state.structure[bone['boneName']]"
            :boneValue="toRaw(state.skel[bone['boneName']])"
            renderType="edit"
            :renderLabel="true"
            @sl-bone-change="updateValue"
            @sl-bone-init="updateValue"
            @sl-bone-relational-select="relationSelection($event,bone)"
            :errors="state.errors"
            :inVi="true"
            v-if="state.structure[bone['boneName']]['visible']"
          >
          </sl-bone>
        </template>
      </sl-details>
    </template>
    <!--
    <sl-details summary="DEBUG: Formdata">
      {{ state.formValues }}
    </sl-details>
    <sl-details summary="DEBUG: Errors">
      {{ state.errors }}
    </sl-details>-->

    <template v-if="state.relation_opened">
    <template v-for="bone in state.relation_opened">
      <sl-dialog open style="--width:85%" class="relation-popup"
                 :label="'Auswahl: '+bone['boneStructure']['descr']"
                 @sl-request-close="relationCloseAction($event)"
      >
        <component
          :is="bone['bone_conf']['handlerComponent']"
          :rowselect="1"
          :module="bone['boneStructure']['module']"
          @currentSelection="relationUpdateSelection($event,bone)"
        >

        </component>
        <div class="footer" slot="footer">
            <sl-button :disabled="!bone['currentSelection'] || bone['currentSelection']?.length===0"
                       @click="relationApplySelection(bone)"
                       variant="success"
                        size="small">
              {{ $t("relation.select") }}
            </sl-button>
            <sl-button @click="relationRemoveHandler(bone)" variant="danger" size="small" outline>{{ $t("relation.abort") }}</sl-button>
        </div>
      </sl-dialog>
    </template>
      </template>
  </div>


</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, onBeforeMount, computed, provide, toRaw} from 'vue'
import {Request} from "@viur/viur-vue-utils";
import {useAppStore} from "../../stores/app";
import {useRoute} from "vue-router";
import bone from "../../components/Bones/edit/bone.vue";
import EntryBar from "../Bars/EntryBar.vue";
import {useModulesStore} from "../../stores/modules";
import handlers from "../DataHandler/handlers";

export default defineComponent({
  props: {
    module: {
      type: String,
      required: true
    },
    action: null,
    group: null,
    skelkey: null,
    skeltype: null


  },
  components: {EntryBar, bone, ...handlers},
  setup(props, context) {
    const appStore = useAppStore();
    const route = useRoute();
    const modulesStore = useModulesStore();
    const values = reactive({})
    const state = reactive({
      type:"formhandler",
      skel: {},
      structure: {},
      errors: [],
      conf: computed(() => {
        return appStore.getConf(props.module)
      }),
      formGroups: computed(() => {
        let groups = {"default": {"name": "Allgemein", "bones": [], "groupVisible": false}}
        for (const [boneName, bone] of Object.entries(state.structure)) {
          let category = "default"
          let boneStructure = state.structure[boneName]
          let boneValue = state.skel[boneName]
          if (bone?.params?.category) {
            category = bone.params.category
          }


          if (Object.keys(groups).includes(category)) {
            groups[category]["bones"].push({
              "boneName": boneName,
              "boneStructure": boneStructure,
              "boneValue": boneValue
            })
          } else {
            groups[category] = {
              "name": category, "bones": [{
                "boneName": boneName,
                "boneStructure": boneStructure,
                "boneValue": boneValue
              }]
            }
          }
          if (boneStructure["visible"] === true) {
            groups[category]["groupVisible"] = true
          }


        }
        return groups
      }),
      formValues: {},
      module: props.module,
      action: props.action,
      group: props.group,
      skelkey: props.skelkey,
      skeltype: props.skeltype,
      relation_opened: []
    })
    provide("state", state)

    function structureToDict(structure: object) {
      if (Array.isArray(structure)) {
          let struct = {};
          for (const idx in structure) {
            struct[structure[idx][0]] = structure[idx][1];
          }
          return struct;
        }else{
          return structure;
        }
    }

    function fetchData() {
      let url = `/vi/${props.module}/${props.action === "clone" ? "edit" : props.action}`;

      if (props.group) url + `/${props.group}`

      if (props.action === "edit" || props.action === "clone") {
        if (state.skeltype === "node") {
          url += `/node`
        }else if (state.skeltype === "leaf"){
          url += `/leaf`
        }
        url += `/${props.skelkey}`
      }

      const dataObj = {}
      if (state.skeltype === "node" && props.action === "add") {
        dataObj["skelType"] = "node"
        dataObj["node"] = props.skelkey
      }

      if (state.skeltype === "leaf" && props.action === "add") {
        dataObj["skelType"] = "leaf"
        dataObj["node"] = props.skelkey
      }

      console.log("new url ", url)
      console.log(dataObj)



      Request.securePost(url, {"dataObj": dataObj}).then(async (resp) => {
        let data = await resp.json()
        state.skel = data["values"]
        state.structure = structureToDict(data["structure"])
        state.errors = data["errors"]
      })

    }

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

    function updateValue(event: Object) {
      console.log(event)
      state.formValues[event.detail.boneName] = event.detail.formValue;
      if (event.detail.boneName === "name") {
        appStore.updateActiveTabName(event.detail.formValue[0]["name"])
      }
    }

    function relationSelection(event,bone) {
      bone["bone_instance"] = event.target
      bone["bone_instance_boneName"] = event["detail"]["boneName"]
      bone["bone_conf"] = appStore.getConf(bone['boneStructure']['module'])

      state.relation_opened.push(bone)
    }

    function relationUpdateSelection(event,bone){
      bone["currentSelection"] = event
    }

    function relationApplySelection(bone){
      for(let skel of bone["currentSelection"]){
        bone["bone_instance"].addRelation(toRaw(skel),bone["bone_instance_boneName"] )
      }
      relationRemoveHandler(bone)
    }

    function relationCloseAction(event,bone) {
      if (event.detail.source === 'overlay') {
        event.preventDefault()
        return 0
      }
      relationRemoveHandler(bone)
    }

    function relationRemoveHandler(bone){
      state.relation_opened = state.relation_opened.filter(i=>i!==bone)
    }



    onBeforeMount(() => {
      fetchData()
    })
    return {
      state,
      values,
      getWidget,
      updateValue,
      modulesStore,
      relationSelection,
      toRaw,
      relationCloseAction,
      relationUpdateSelection,
      relationApplySelection,
      relationRemoveHandler
    }
  }
})
</script>

<style scoped lang="less">

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
  box-shadow: 0 0 5px 0 rgba(0, 0, 0, .25);
  z-index: 1;
}

.top-headline {
  margin-right: auto;
  color: var(--vi-foreground-color);
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
  }
}

.relation-popup{
  &::part(base) {
    position: absolute;
    height: 100%;
  }

  &::part(panel) {
    height: 100%;
  }

  &::part(body){
    display: contents;
  }

  &::part(footer){
    padding: var(--sl-spacing-small);
  }

  &::part(overlay) {
    position: absolute;
  }
}

.footer{
  sl-button{
    margin-left: var(--sl-spacing-x-small);
  }
}

</style>
