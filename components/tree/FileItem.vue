<template>
  <tr
    :key="skel['key']"
    :draggable="browserState.dragging"
    :class="{
      isSelected: browserState.selected_leaf?.key === skel.key,
      dropin: state.currentEntry['_isover'] && state.currentEntry['_drop'] === 'in',
      dropafter: state.currentEntry['_isover'] && state.currentEntry['_drop'] === 'after',
      dropbefore: state.currentEntry['_isover'] && state.currentEntry['_drop'] === 'before'
    }"
    @dragstart="tree.onDragStart($event, idx, 'leaf')"
    @drop.stop="tree.onDrop($event, idx)"
    @click="entrySelected(skel)"
  >
    <td v-if="false">
      <sl-checkbox @sl-change="selectItem"></sl-checkbox>
    </td>
    <td>
      <div class="file">
        <div
          v-if="browserState.dragging"
          class="dragger"
          @mouseup="tree.mouseUpHandle($event, idx, 'leaf')"
          @mousedown="tree.mouseDownHandle($event, idx, 'leaf')"
        >
          <sl-icon name="grip-vertical"></sl-icon>
        </div>
        <sl-icon
          name="download"
          title="download"
          sprite
          @click="downloadFile(skel)"
        ></sl-icon>
        <span
          class="filename"
          v-html="skel.name"
        ></span>
      </div>
    </td>
    <td>
      <sl-format-date
        year="numeric"
        month="numeric"
        day="2-digit"
        :date="skel.changedate"
      ></sl-format-date>
    </td>
    <td>
      <sl-tooltip :content="skel.mimetype">
        <div
          class="file-type"
          v-html="skel.name.split('.').pop().length > 0 ? skel.name.split('.').pop() : skel.name"
        ></div>
      </sl-tooltip>
    </td>
    <td>
      <sl-format-bytes :value="skel['size']"></sl-format-bytes>
    </td>
  </tr>
</template>

<script>
import { reactive, defineComponent, onMounted, inject, computed } from "vue"
import useTree from "./tree"
import { Request } from "@viur/vue-utils"

export default defineComponent({
  props: {
    module: {
      type: String,
      required: true
    },
    skel: {
      type: Object
    },
    idx: {
      type: Number
    },
    path: {
      type: Array
    }
  },
  components: {},
  setup(props, context) {
    const browserState = inject("browserState")
    const state = reactive({
      currentEntry: {},
      child: computed(() => {
        if (!state.currentEntry["_leafs"]) {
          return null
        }
        return state.currentEntry["_leafs"][props.idx]
      })
    })

    onMounted(() => {
      state.currentEntry = tree.EntryFromPath(props.path)
    })

    //activate File
    function entrySelected(skel) {
      browserState.selected_leaf = skel
    }
    function downloadFile(skel) {
      window.open(Request.downloadUrlFor({ dest: skel }, false), "_blank", "noreferrer")
    }

    function selectItem(e) {
      let elementList = browserState.userSelection.filter((x) => x["key"] === props.skel["key"])
      if (e.target.checked && elementList.length === 0) {
        //add if not in list and selected
        browserState.userSelection.push(props.skel)
      } else if (!e.target.checked && elementList.length !== 0) {
        //remove if not selected and in list
        browserState.userSelection = browserState.userSelection.filter((x) => x["key"] !== props.skel["key"])
      }
    }

    const tree = useTree(props.module, browserState, state)
    return {
      state,
      browserState,
      tree,
      entrySelected,
      downloadFile,
      selectItem
    }
  }
})
</script>

<style scoped>
.file {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: nowrap;
  color: var(--vi-foreground-color);

  & span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }

  & sl-icon {
    margin-right: 10px;
  }

  &:hover {
    & .dragger {
      opacity: 1;
    }
  }
}

tr {
  position: relative;
  transition: all ease 0.3s;
  cursor: pointer;
  border-bottom: solid 1px var(--sl-color-neutral-300) !important;

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

.dragger {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-right: var(--sl-spacing-x-small);
  height: 100%;
  cursor: move;
  opacity: 0.2;
  transition: opacity ease 0.3s;
  color: var(--vi-foreground-color);

  & sl-icon {
    font-size: 1em;
  }
}
</style>
