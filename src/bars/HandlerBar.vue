<template>
  <div class="bar">
    
    <template v-for="(actionlist, index) in state.actions['default']">
      <template v-for="action in actionlist">
        <group_action
          v-if="action.startsWith(':')"
          :group="state.actionGroups[action.substring(1)]"
        >
          <div
            v-for="(actiongrouplist, groupindex) in state.actions[action]"
            class="action-group"
          >
            <template v-for="groupaction in actiongrouplist">
              <sl-menu-item>
                <component :is="currentAction(`${groupaction}_action`)">
                  <script_action
                    v-if="groupaction.startsWith('scriptor_')"
                    :name="groupaction"
                  ></script_action>
                  <custom_action
                    v-else
                    :name="groupaction"
                  ></custom_action>
                </component>
              </sl-menu-item>
            </template>
          </div>
        </group_action>
        
        <component
          :is="currentAction(`${action}_action`)"
          v-else
        >
          <script_action
            v-if="action.startsWith('scriptor_')"
            :name="action"
          ></script_action>
          <custom_action
            v-else
            :name="action"
          ></custom_action>
        </component>
      </template>

      <space_action v-if="index < state.actions['default'].length - 1"></space_action>
    </template>
  </div>
</template>

<script setup>
import { reactive, defineComponent, computed, inject } from "vue"
import { useDBStore } from "../stores/db"
import { useRoute } from "vue-router"

import { useModulesStore } from "../stores/modules"
import baractions from "../actions/actions"
import space_action from '../actions/space.vue'
import group_action from '../actions/group.vue'
import custom_action from "../actions/custom.vue"
import script_action from "../actions/script.vue"

  function currentAction(name){
    return baractions?.[name]?baractions[name]:name
  }

  const props = defineProps({
    module: {
      type: String,
      required: true
    },
    actions: {
      type: Array,
      default: []
    },
    handler: null
  })
  
    const handlerState = inject("handlerState")
    const modulesStore = useModulesStore()
    const dbStore = useDBStore()
    const route = useRoute()

    const state = reactive({
      actionGroups: {
        options: {
          name: "Optionen"
        }
      },
      actions: computed(() => {
        let listActions = {
          ":options": [["selectfields", "overlay"]],
          default: [["selectfields"], ["search", "preview", "delete", "clone", "edit", "add"]] //":options"
        }

        const hierarchyActions = {
          ":options": [["selectfields", "overlay"]],
          default: [
            ["selectfields", "rootnodelist"],
            ["preview", "delete", "clone", "edit", "addnode"]
          ]
        }

        const fileActions = {
          ":options": [["selectfields", "overlay"]],
          default: [
            ["selectfields", "rootnodelist", "reload"],
            ["overlay", "preview", "delete", "clone", "edit", "move", "addfolder", "addfile"]
          ]
        }

        const treeActions = {
          ":options": [["selectfields", "overlay"]],
          default: [
            ["selectfields", "rootnodelist", "reload"],
            ["preview", "delete", "clone", "edit", "move", "addnode", "addleaf"]
          ]
        }

        let fluidpageActions = {
          ":options": [["selectfields", "overlay"]],
          default: [["selectfields"], ["search", "preview", "fluidpage", "delete", "clone", "edit", "add"]]
        }

        let fluidpagecontentActions = {
          ":options": [],
          default: [["reload"], ["fluidpagepreview","preview","add"]]
        }

        //given props overrides calculation
        if (props.actions?.length > 0) return props.actions

        // find matching conf
        let actions = { ...listActions }
        let conf = dbStore.getConf(handlerState.module, handlerState.view)
        let handler = conf?.["handler"]

        if (!handler && props.handler) {
          handler = props.handler
        }

        if (!conf) return actions
        if (handler.startsWith("tree.node")) {
          actions = { ...hierarchyActions }
        } else if (handler.startsWith("tree.file") || handler.startsWith("tree.simple.file")) {
          actions = { ...fileActions }
        } else if (handler.startsWith("tree")) {
          actions = { ...treeActions }
        } else if (handler.startsWith("list.fluidpage") && handler !== "list.fluidpage.content") {
          actions = { ...fluidpageActions }
        } else if (handler.startsWith("list.fluidpage.content")) {
          actions = { ...fluidpagecontentActions }
        }

        //remove disabledActions from all objects
        if (Object.keys(conf).includes("disabledActions") && conf["disabledActions"].length > 0) {
          // remove actions
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
          let actiongroups = conf["actions"]
            .join(" ")
            .replace("$", "")
            .replace("=", "")
            .replace(/\n\s/g, "")
            .replace(/\n\s/g, "")
            .replace(/\n/g, "")
            .replace(/\|\s/g, "space")
          //add after the first group
          //actions["default"].splice(1, 0, actiongroups.split(" "))
          //add to the first group
          actions["default"][0] = actions["default"][0].concat(actiongroups.split(" "))
        }

        if (modulesStore.state.modules?.[props.module]?.["scripts"]) {
          for (const script of modulesStore.state.modules[props.module]["scripts"]) {
            actions["default"][0].push("scriptor_" + script["dest"]["key"])
          }
        }

        if (Object.keys(conf).includes("actionGroups")) {
          for (const [groupName, config] of Object.entries(conf["actionGroups"])) {
            state.actionGroups[groupName] = config
            actions[":" + groupName] = [
              config["actions"]
                .join(" ")
                .replace("$", "")
                .replace("=", "")
                .replace(/\n\s/g, "")
                .replace(/\n/g, "")
                .replace(/\|\s/g, "space")
                .split(" ")
            ]
          }
        }

        return actions
      })
    })
</script>

<style scoped>
.bar {
  display: flex;
  flex-wrap: wrap;
  padding: var(--sl-spacing-small);
  gap: var(--sl-spacing-small);
  width: 100%;
  color: var(--vi-foreground-color);
  border-bottom: 1px solid var(--vi-border-color);
}

.spacer {
  margin: auto;
}

.action-group:not(:last-child) {
  border-bottom: 1px solid var(--vi-border-color);
  margin-bottom: var(--sl-spacing-x-small);
}

sl-menu-item {
  overflow: hidden;

  &::part(base) {
    padding: 0;
    margin: 0 var(--sl-spacing-x-small);
    background-color: transparent !important;
  }
  &::part(checked-icon) {
    display: none;
  }
  &::part(prefix) {
    display: none;
  }
  &::part(suffix) {
    display: none;
  }

  &::part(label) {
    flex: 1 0 100%;
  }

  &:not(:last-child) {
    margin-bottom: var(--sl-spacing-x-small);
  }

  & :deep(sl-button) {
    width: 100%;

    &::part(base) {
      justify-content: flex-start;
    }
  }

  & sl-switch {
    &::part(base) {
      margin: 5px 0 8px 0;
    }
  }
}
</style>
