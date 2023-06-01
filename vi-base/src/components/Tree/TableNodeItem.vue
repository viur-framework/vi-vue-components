<template>
  <template v-for="(child,idx) in state.currentEntry['_nodes']" :key="child['key']">
    <tr
        :draggable="child['_dragging'] && treeState.dragging"
        :data-layer="state.layer"
        @dragstart="tree.onDragStart($event, idx)"
        @dragenter.prevent="tree.onDragEnter($event, idx)"
        @dragover.prevent="tree.onDragOver($event, idx)"
        @dragleave="tree.onDragLeave($event, idx)"
        @drop.stop="tree.onDrop($event, idx)"
        class="entry"
        :class="{'dropin':child['_isover'] && child['_drop']==='in',
              'dropafter':child['_isover'] && child['_drop']==='after',
              'dropbefore':child['_isover'] && child['_drop']==='before',
              'active':isactive(idx)
      }"
    >
      <td class="dragger" v-if="treeState.dragging"
                @mouseup="tree.mouseUpHandle($event, idx)"
                @mousedown="tree.mouseDownHandle($event, idx)">
                <sl-icon name="menu"></sl-icon>
      </td>

      <td class="chevron"
          @click="clickToExpand(idx)">

          <sl-icon name="play"  :style="{marginLeft:((path.concat([idx]).length-2)*10)+'px'}"
            :class="{disabled:child['_disabled'], expanded:child['_expanded']}"
        ></sl-icon>

        <div class="loading" v-if="child['_status']==='loading'">
          <sl-spinner></sl-spinner>
        </div>
      </td>

      <template v-for="(name) in Object.keys(child)">
        <td @click="selectChild(idx)" v-if="!name?.startsWith('_')">{{ getBoneViewer(child,name) }}</td>
      </template>
    </tr>
    <table-node-item v-if="child['_expanded']" :module="module" :path="path.concat([idx])"></table-node-item>
</template>
</template>

<script lang="js">
import {reactive, defineComponent, inject, onBeforeMount, watch, computed, onMounted, unref, toRaw} from 'vue'
import {Request,boneLogic} from "@viur/viur-vue-utils";
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
      layer:computed(()=>props.path.length)
    })
    const tree = useTree(props.module,treeState,state)

    function structureToDict(structure) {
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
          if (!treeState.structure || Object.keys(treeState.structure).length===0){
            treeState.structure = structureToDict(data["structure"])
          }

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
      console.log("expand")
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

    function getBoneViewer(skel, boneName){
      const {getBoneValue, bones_state} = boneLogic(skel, treeState.structure)
      return getBoneValue(boneName, skel=skel)
    }

    return {
      state, treeState,
      clickToExpand,
      isactive,
      selectChild,
      tree,
      getBoneViewer
    }
  }
})
</script>

<style scoped lang="less">
.dropin {
  background-color: var(--sl-color-neutral-400);
}

.dropafter {
  border-bottom: 4px solid var(--sl-color-neutral-400) !important;
}

.dropbefore {
  border-top: 4px solid var(--sl-color-neutral-400) !important;
}


tr{
  cursor: pointer;
  transition: all ease .3s;

  td{
    padding: .4em .6em;
    overflow: hidden;
    word-wrap: break-word;
    border-right: 1px solid var(--sl-color-gray-300);
    border-bottom: 1px solid var(--sl-color-gray-300);

    &:last-child{
      border-right: 0;
    }
  }

  &:nth-child(even){
    background-color: var(--sl-color-gray-100);
  }

  &:hover{
    background-color: var(--sl-color-gray-200);
  }
}

tr.selected{
  background-color: var(--sl-color-primary-50);

  td{
    font-weight: 700;
  }
}




.dragger{
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

.active {
  color: var(--sl-color-primary-500);
  font-weight: 600;
}


.entry {
  padding: 0 10px;
  cursor: pointer;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;

  &:hover{
    .dragger{
      opacity: 1;
    }
  }
}

.loading{
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.6);
}

.item {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.item-icon {
  width: 1em;
  height: 1em;
  margin-right: var(--sl-spacing-small);
  color: var(--vi-foreground-color);
}

.chevron{
  width: 1em;
  height: 1em;
  margin-right: var(--sl-spacing-x-small);

  sl-icon{
	font-size: .4em;
  color: var(--vi-foreground-color);

	&.expanded{
	  transform: rotate(90deg);
	}

	&.disabled{
	  opacity: .4;
	}
  }
}

.title{
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--vi-foreground-color);
}

.disabled {
  opacity: .4;
}

</style>
