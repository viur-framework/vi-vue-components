<template>
  <div class="bar">
    <sl-button variant="info"
                   size="small"
                   class="module-info"
                    title="Module Info"
                   v-if="modulesStore.state.modules[module]['help_text']"
                    @click="state.open=!state.open">
      <sl-icon name="question"></sl-icon>
    </sl-button>
    <sl-dialog
          :label="modulesStore.state.modules[module]['name']"
           :open="state.open"
          @sl-hide="state.open=!state.open"
           >
      <div v-html="modulesStore.state.modules[module]['help_text']"></div>
    </sl-dialog>
    <template v-for="(actionlist,index) in state.actions['default']">
      <template v-for="action in actionlist">
        <group_action v-if="action.startsWith(':')" :group="state.actionGroups[action.substring(1)]">
          <div v-for="(actiongrouplist,groupindex) in state.actions[action]" class="action-group">
            <template v-for="groupaction in actiongrouplist">
              <sl-menu-item>
                <component :is="`${groupaction}_action`"
                           size="small"
                >
                  <custom_action :name="groupaction"></custom_action>
                </component>
              </sl-menu-item>
            </template>
          </div>
        </group_action>

        <component v-else :is="`${action}_action`"
                   size="small"
        >
          <custom_action :name="action"></custom_action>
        </component>
      </template>

      <space_action v-if="index<(state.actions['default'].length-1)"></space_action>
    </template>
  </div>
</template>
<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, computed} from 'vue'
import {useDBStore} from "../../stores/db";
import {useRoute} from "vue-router";
import actions from '../../components/Actions/actions'
import {useModulesStore} from "../../stores/modules";


export default defineComponent({
  props: {
    module: {
      type: String,
      required: true
    },
    actions: {
      type: Array,
      default: []
    }
  },
  components: {...actions},
  setup(props, context) {
    const dbStore = useDBStore()
    const route = useRoute()
    const modulesStore = useModulesStore();


    const state = reactive({
      actionGroups: {
          "options":{
            "name":"Optionen"}
        },
      actions: computed(() => {
        let listActions = {
          ":options": [["selectfields","overlay"]],
          "default": [[":options"],["search","delete", "clone","preview", "edit", "add"]],
        }

        const hierarchyActions = {
          ":options": [["selectfields","overlay"]],
          "default": [[":options","rootnodelist"],["delete", "clone","preview", "edit", "addnode"]],
        }

        const treeActions = {
          ":options": [["selectfields","overlay"]],
          "default": [[":options", "rootnodelist"],["delete", "clone","preview", "edit", "addfolder","addfile"]],
        }

        let fluidpageActions = {
          ":options": [["selectfields","overlay"]],
          "default": [[":options"],["fluidpage","delete", "clone","preview", "edit", "add"]],
        }

        let fluidpagecontentActions = {
          ":options": [],
          "default": [["reload"],["preview", "add"]],
        }



        //given props overrides calculation
        if (props.actions?.length > 0) return props.actions

        // find matching conf
        let conf = dbStore.getConfByRoute(route);
        let actions = {...listActions}
        if (!conf) return actions;
        if (conf["handler"].startsWith("tree.node")) {
          actions = {...hierarchyActions}
        }else if (conf["handler"].startsWith("tree")) {
          actions = {...treeActions}
        }else if (conf["handler"].startsWith("list.fluidpage") && conf["handler"]!=="list.fluidpage.content") {
          actions = {...fluidpageActions}
        }else if (conf["handler"].startsWith("list.fluidpage.content")) {
          actions = {...fluidpagecontentActions}
        }

        //remove disabledActions from all objects
        if (Object.keys(conf).includes("disabledActions") && conf["disabledActions"].length > 0) { // remove actions
          for (let rmAction of conf["disabledActions"]) {
            for (let actiongroup in actions) {
              let actionlists = actions[actiongroup]
              for (let actionlist of actionlists) {
                for (let action of actionlist) {
                  if (rmAction === action) {
                    delete actionlist[action]
                    actionlist.splice(actionlist.indexOf(action), 1)
                  }
                }
              }
            }
          }
        }

        if (conf["actions"]) {
          //build listed structure
          let actiongroups = conf["actions"].join(" ").replace(/\n\s/g, "").replace(/\n/g, "").replace(/\|\s/g, "space")
          //add after the first group
          //actions["default"].splice(1, 0, actiongroups.split(" "))
          //add to the first group
          actions["default"][0]= actions["default"][0].concat(actiongroups.split(" "))
        }

        if (Object.keys(conf).includes("actionGroups")){
          for (const [groupName, config] of Object.entries(conf["actionGroups"])) {
            state.actionGroups[groupName] = config
            actions[":"+groupName] = [config["actions"].join(" ").replace(/\n\s/g, "").replace(/\n/g, "").replace(/\|\s/g, "space").split(" ")]
          }
        }

        console.log(actions)
        return actions
      })
    })
    return {
      state,
    modulesStore,
    }
  }
})
</script>

<style scoped lang="less">
.bar {
  display: flex;
  flex-wrap: nowrap;
  padding: var(--sl-spacing-small);
  gap: var(--sl-spacing-small);
  width: 100%;
  color: var(--vi-foreground-color);
  border-bottom: 1px solid var(--vi-border-color);
}

.spacer {
  margin: auto
}

.action-group:not(:last-child){
 border-bottom: 1px solid var(--vi-border-color);
  margin-bottom: var(--sl-spacing-x-small);
}

sl-menu-item{
  overflow: hidden;

  &::part(base){
    padding: 0;
    margin: 0 var(--sl-spacing-x-small);
    background-color: transparent !important;
  }
  &::part(checked-icon){
    display: none;
  }
  &::part(prefix){
    display: none;
  }
  &::part(suffix){
    display: none;
  }

  &::part(label){
    flex: 1 0 100%;
  }

  &:not(:last-child){
    margin-bottom: var(--sl-spacing-x-small);
  }

  :deep(sl-button){
    width: 100%;

    &::part(base){
      justify-content: flex-start;
    }
  }

  sl-switch{
    &::part(base){
      margin: 5px 0 8px 0;
    }
  }
}


.module-info{

  &::part(base){
    aspect-ratio: 1;
  }
}
</style>
