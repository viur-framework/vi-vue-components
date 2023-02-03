<template>
  <li v-for="(child,idx) in state.currentEntry['_nodes']"
      :key="child['key']"
      :style="{marginLeft:((path.concat([idx]).length-1)*10)+'px'}"
  >
    <div class="entry"
         :draggable="child['_dragging'] && treeState.dragging"
         @dragstart="tree.onDragStart($event, idx)"
         @dragenter.prevent="tree.onDragEnter($event, idx)"
         @dragover.prevent="tree.onDragOver($event, idx)"
         @dragleave="tree.onDragLeave($event, idx)"
         @drop.stop="tree.onDrop($event, idx)"
         :class="{'dropin':child['_isover'] && child['_drop']==='in',
               'dropafter':child['_isover'] && child['_drop']==='after',
               'dropbefore':child['_isover'] && child['_drop']==='before'
      }"

    >
      <sl-icon name="menu" v-if="treeState.dragging"
               @mouseup="tree.mouseUpHandle($event, idx)"
               @mousedown="tree.mouseDownHandle($event, idx)">

      </sl-icon>
      <sl-icon :name="child['_expanded']?'chevron-down':'chevron-right'"
               @click="clickToExpand(idx)"
               :class="{disabled:child['_disabled']}"
      >

      </sl-icon>
      <sl-spinner v-if="child['_status']==='loading'"></sl-spinner>

      <div class="item"
           @click="selectChild(idx)"
           :class="{active:isactive(idx)}"
      >
        <sl-icon name="folder"></sl-icon>

        <div>
          {{ child['name'] }}
        </div>
      </div>
    </div>
    <tree-folder-item :module="module" :path="path.concat([idx])" v-if="child['_expanded']"></tree-folder-item>
  </li>
</template>

<script lang="js">
import {reactive, defineComponent, inject, onBeforeMount, watch, computed, onMounted, unref, toRaw} from 'vue'
import {Request} from "@viur/viur-vue-utils";
import useTree from "./tree.js";

export default defineComponent({
  components: {},
  props: {
    module: {
      type: String,
      required: true
    },
    path: {
      type: Array
    }
  },

  setup(props, context) {
    const treeState = inject("state")
    const state = reactive({
      currentEntry: {},
    })
    const tree = useTree(props.module,treeState,state)

    onMounted(() => {
      state.currentEntry = tree.EntryFromPath(props.path)
      if (props.path && props.path.length === 1 && props.path[0] === 0) { // prefetch rootnode childs
        state.currentEntry['_status'] = 'loading'
        Request.get(`/vi/${props.module}/list`, {
          dataObj: {
            "skelType": "node",
            "orderby": "sortindex",
            "parententry": state.currentEntry["key"]
          }
        }).then(async (resp) => {
          let data = await resp.json()
          state.currentEntry['_nodes'] = data["skellist"]
          state.currentEntry['_disabled'] = false
          state.currentEntry['_status'] = 'loaded' //loading, loaded
          state.currentEntry['_dragging'] = false
          state.currentEntry['_isover'] = false
          state.currentEntry['_drop'] = null
        })
      }
    })

    function selectChild(idx) {
      treeState.selectedPath = props.path.concat([idx])
    }

    function isactive(idx) {
      return treeState.selectedPath.toString() === props.path.concat([idx]).toString()
    }

    function clickToExpand(idx) {
      if (state.currentEntry['_nodes'][idx]['_loading'] === true) return 0 //wait

      if (!Object.keys(state.currentEntry['_nodes'][idx]).includes('_nodes')) {
        tree.requestChildren(idx).then(() => expandChildren(idx))
      } else {
        expandChildren(idx)
      }
    }

    function expandChildren(idx) {
      let clickedEntry = state.currentEntry['_nodes'][idx]
      if (Object.keys(clickedEntry).includes("_expanded")) {
        clickedEntry["_expanded"] = !clickedEntry["_expanded"]
      } else {
        clickedEntry["_expanded"] = true
      }
    }

    return {
      state, treeState,
      clickToExpand,
      isactive,
      selectChild,
      tree
    }
  }
})
</script>

<style scoped lang="less">
.dropin {
  background-color: red;
}

.dropafter {
  background-color: blue;
}

.dropbefore {
  background-color: green;
}


.active {
  color: var(--sl-color-primary-500);
}

.entry {
  display: flex;
  align-items: center;
}

.item {
  display: flex;
}

.disabled {
  color: var(--sl-color-neutral-200);
  //pointer-events: none;
  //cursor: not-allowed;
}

</style>
