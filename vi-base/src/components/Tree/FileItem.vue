<template>
  <tr
    :draggable="treeState.dragging"
    @dragstart="tree.onDragStart($event, idx, 'leaf')"
    @drop.stop="tree.onDrop($event, idx)"
    :class="{
            isSelected: treeState.selected_leaf?.key === skel.key,
           'dropin':state.currentEntry['_isover'] && state.currentEntry['_drop']==='in',
           'dropafter':state.currentEntry['_isover'] && state.currentEntry['_drop']==='after',
           'dropbefore':state.currentEntry['_isover'] && state.currentEntry['_drop']==='before'
    }"
    :key="skel['key']"
  >
    <td>
      <div class="file">
        <div class="dragger" v-if="treeState.dragging"
               @mouseup="tree.mouseUpHandle($event, idx, 'leaf')"
               @mousedown="tree.mouseDownHandle($event, idx, 'leaf')">

        <sl-icon name="menu"></sl-icon>
        </div>
        <sl-icon name="download" sprite @click="downloadFile(skel)"></sl-icon>
        <span class="filename" v-html="skel.name"  @click="entrySelected(skel)"></span>
      </div>
    </td>
    <td>
      <sl-format-date year="numeric" month="numeric" day="2-digit" :date="skel.creationdate"></sl-format-date>
    </td>
    <td>
      <sl-format-date year="numeric" month="numeric" day="2-digit" :date="skel.changedate"></sl-format-date>
    </td>
  </tr>


</template>

<script>
import {reactive, defineComponent, onMounted, inject, computed} from 'vue'
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
    }
  },
  components: {},
  setup(props, context) {
    const treeState = inject("state")
    const state = reactive({
       currentEntry:{},
      child:computed(()=>{
        if (!state.currentEntry['_leafs']){
          return null
        }
        return state.currentEntry['_leafs'][props.idx]
      })
    })

    onMounted(() => {
      state.currentEntry = tree.EntryFromPath(props.path)
    })


    //activate File
    function entrySelected(skel) {
      treeState.selected_leaf = skel
    }
    function downloadFile(skel)
    {
       window.open(import.meta.env.VITE_API_URL+skel["downloadUrl"]+"&download=1", '_blank');
    }
    const tree = useTree(props.module,treeState,state)
    return {
      state,
      treeState,
      tree,
      entrySelected,
      downloadFile
    }
  }
})
</script>

<style scoped lang="less">
.file {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: nowrap;
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
  transition: all ease .3s;
  cursor: pointer;
  border-bottom: solid 1px  var(--sl-color-neutral-300) !important;

  &:nth-child(odd) {
    background-color: var(--sl-color-neutral-100);
  }

  &:hover {
    background-color: var(--sl-color-neutral-200);
  }

  &.isSelected {

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
