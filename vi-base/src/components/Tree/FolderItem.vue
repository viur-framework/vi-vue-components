<template>
  <tr class="noderow entry"
      :draggable="state.child?.['_dragging'] && treeState.dragging"
      @dragstart="tree.onDragStart($event, idx)"
      @dragenter.prevent="tree.onDragEnter($event, idx)"
      @dragover.prevent="tree.onDragOver($event, idx)"
      @dragleave="tree.onDragLeave($event, idx)"
      @drop.stop="tree.onDrop($event, idx)"
      :class="{'dropin':state.child?.['_isover'] && state.child?.['_drop']==='in',
             'dropafter':state.child?.['_isover'] && state.child?.['_drop']==='after',
             'dropbefore':state.child?.['_isover'] && state.child?.['_drop']==='before'
      }"
  >
    <td>
      <div v-if="up" class="folder" >
        <sl-icon name="folder" sprite @click="changeParentEntryUp"></sl-icon>
        <span class="filename" @click="changeParentEntryUp">..</span>
      </div>
      <div v-else class="folder" >
        <div class="dragger" v-if="treeState.dragging"
               @mouseup="tree.mouseUpHandle($event, idx)"
               @mousedown="tree.mouseDownHandle($event, idx)">
        <sl-icon name="menu"></sl-icon>
        </div>
        <sl-icon name="folder" sprite @click="changeParentEntry(idx)"></sl-icon>
        <span class="filename" v-html="skel['name']" @click="changeParentEntry(idx)"></span>
      </div>
    </td>
    <td @click="changeParentEntry(idx)">
      <sl-format-date year="numeric" month="numeric" day="2-digit" :date="skel['creationdat']"></sl-format-date>
    </td>
    <td @click="changeParentEntry(idx)">
      <sl-format-date year="numeric" month="numeric" day="2-digit" :date="skel['changedate']"></sl-format-date>
    </td>
  </tr>
</template>

<script>
import {reactive, defineComponent, onMounted, inject, computed, watch} from 'vue'
import useTree from "./tree";
import {Request} from "@viur/viur-vue-utils";

export default defineComponent({
  props: {
    module: {
      type: String,
      required: true
    },
    skel: {
      type: Object
    },
    idx:{
      type:Number
    },
    path:{
      type:Array
    },
    up:Boolean
  },
  components: {},
  setup(props, context) {
    const treeState = inject("state")
    const state = reactive({
      currentEntry:{},
      child:computed(()=>{
        if (!state.currentEntry['_nodes']){
          return null
        }
        return state.currentEntry['_nodes'][props.idx]
      })
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
          state.currentEntry['_overElement'] = null
          state.currentEntry['_drop'] = null
        })
      }
    })

    //folder navigation
    function changeParentEntry(idx) {
      treeState.selectedPath.push(idx)
      treeState.selected_leaf = null
    }

    function changeParentEntryUp() {
      treeState.selectedPath = treeState.selectedPath.splice(0,-1)
      treeState.selected_leaf = null
    }

    return {
      state,
      treeState,
      tree,
      changeParentEntry,
      changeParentEntryUp
    }
  }
})
</script>

<style scoped lang="less">
.folder, .file {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  color: var(--vi-foreground-color);

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }

  sl-icon {
    margin-right: 10px;
  }

  &:hover{
    .dragger{
      opacity: 1;
    }
  }
}

tr {
  position: relative;
  cursor: pointer;
  transition: background-color ease .3s;
    border-bottom: solid 1px  var(--sl-color-neutral-300) !important;

  &:nth-child(odd) {
    background-color: var(--sl-color-neutral-100);
  }

  &:hover {
    background-color: var(--sl-color-neutral-200);
  }

  &.isSelected {
    color: var(--sl-color-primary-500);

    * {
      font-weight: 600;
    }
  }
}

td {
  max-width: 5px;
  overflow: hidden;
  word-wrap: break-word;
  padding: 6px 8px;
}

.dropin {
  background-color: var(--sl-color-neutral-400);
}

.dropafter {
  border-bottom: 4px solid var(--sl-color-neutral-400) !important;
}

.dropbefore {
  border-top: 4px solid var(--sl-color-neutral-400) !important;
}

.dragger{
  display: flex;
  justify-content: center;
  align-items: center;
  padding-right: var(--sl-spacing-x-small);
  height: 100%;
  cursor: move;
  opacity: .2;
  transition: opacity ease .3s;
  color: var(--vi-foreground-color);

  sl-icon{
    font-size: .7em;
  }
}


</style>
