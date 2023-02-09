<template>
  <tr
    :draggable="treeState.dragging"
    @dragstart="tree.onDragStart($event, idx)"
    @dragenter.prevent="tree.onDragEnter($event, idx)"
    @dragover.prevent="tree.onDragOver($event, idx)"
    @dragleave="tree.onDragLeave($event, idx)"
    @drop.stop="tree.onDrop($event, idx)"
    :class="{
            isSelected: treeState.selected_leaf?.key === skel.key,
           'dropin':state.currentEntry['_isover'] && state.currentEntry['_drop']==='in',
           'dropafter':state.currentEntry['_isover'] && state.currentEntry['_drop']==='after',
           'dropbefore':state.currentEntry['_isover'] && state.currentEntry['_drop']==='before'
    }"
    :key="skel['key']" @click="entrySelected(skel)"
  >
    <td>
      <div class="file">
        <sl-icon name="download-file" sprite></sl-icon>
        <span class="filename" v-html="skel.name"></span>
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
      currentEntry: computed(()=>{
        return tree.EntryFromPath(props.path)
      }),
    })

    //activate File
    function entrySelected(skel) {
      treeState.selected_leaf = skel
    }
    const tree = useTree(props.module,treeState,state)
    return {
      state,
      treeState,
      tree,
      entrySelected
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

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }

  sl-icon {
    margin-right: 10px;
  }
}

tr {
  position: relative;
  transition: all ease .3s;
  cursor: pointer;

  &:nth-child(odd) {
    background-color: var(--sl-color-neutral-100)
  }

  &:hover {
    background-color: var(--sl-color-primary-50)
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
  background-color: red;
}

.dropafter {
  background-color: blue;
}

.dropbefore {
  background-color: green;
}

</style>
