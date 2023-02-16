<template>
  <div class="bar">
    <template v-for="(actionlist,index) in state.actions['default']">
      <component v-for="action in actionlist"
                 :is="`${action}_action`"
                 size="small"
      >
        <custom_action :name="action"></custom_action>
      </component>
      <space_action v-if="index<(state.actions['default'].length-1)"></space_action>
    </template>
  </div>

  <div class="bar bottombar">
    <template v-for="(actionlist,index) in state.actions['entry']">
      <component v-for="action in actionlist"
                 :is="`${action}_action`"
                 size="small"
      >
      </component>
      <space_action v-if="index<(state.actions['entry'].length-1)"></space_action>
    </template>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, computed} from 'vue'
import {useAppStore} from "../../stores/app";
import {useRoute} from "vue-router";
import actions from '../../components/Actions/actions'


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
    const appStore = useAppStore()
    const route = useRoute()


    const state = reactive({
      actions: computed(() => {
        let listActions = {
          "default": [["add", "selectfields"], ["setamount", "reload"], ["overlay", "filter", "edittable"]],
          "entry": [["edit", "clone", "delete"], ["preview"]]
        }

        const hierarchyActions = {
          "default": [["addnode","selectfields","rootnodelist"], ["reload", "setamount", "overlay"]],
          "entry": [["edit", "clone", "delete"], ["preview"]]
        }

        const treeActions = {
          "default": [["addfolder", "addfile", "selectfields","rootnodelist"], ["reload"]],
          "entry": [["edit", "clone", "delete"]]
        }

        let fluidpageActions = {
          "default": [["add", "selectfields"], ["setamount", "reload"], ["overlay", "filter", "edittable"]],
          "entry": [["edit", "clone", "delete", "fluidpage"], ["preview"]]
        }

        let fluidpagecontentActions = {
          "default": [["add"], ["reload"]],
          "entry": [["edit", "clone", "delete"], ["preview"]]
        }



        //given props overrides calculation
        if (props.actions?.length > 0) return props.actions

        // find matching conf
        let conf = appStore.getConfByRoute(route);
        let actions = {...listActions}

        if (!conf) return actions;
        console.log(conf["handler"])
        if (conf["handler"].startsWith("tree.node")) {
          actions = {...hierarchyActions}
        }else if (conf["handler"].startsWith("tree")) {
          actions = {...treeActions}
        }else if (conf["handler"].startsWith("list.fluidpage") && conf["handler"]!=="list.fluidpage.content") {
          actions = {...fluidpageActions}
        }else if (conf["handler"].startsWith("list.fluidpage.content")) {
          actions = {...fluidpagecontentActions}
        }

        console.log(actions)
        let confActions = conf["actions"]
        if (confActions) {
          confActions = confActions.join(" ").replace(/\|\s/g, "space") // replace pipes with "space"
          if (Object.keys(conf).includes("disabledActions") && conf["disabledActions"].length > 0) {
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

          confActions = confActions.split("\n")

          actions["default"].splice(1, 0, confActions[0].split(" "))
          if (confActions.length > 1) {
            actions["entry"].splice(1, 0, confActions[1].split(" "))
          }

        }
        return actions
      })
    })
    return {state}
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
  background-color: #fff;
  //z-index: 1; //todo
}

.bottombar {
  padding-top: 0;
  border-bottom: 2px solid var(--sl-color-neutral-200)
}

.spacer {
  margin: auto
}
</style>
