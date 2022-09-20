<template>
  <div>
    <handler-bar :module="module"></handler-bar>
    <!--<sl-table rowselect moveablecolumns height="800px"
              :structure.prop="currentlist.structure"
              :skellist.prop="currentlist.state.skellist"
              @sl-selectionChanged="entrySelected"
    >

    </sl-table>-->

    <sl-table moveablecolumns
              :rowselect="true"
              :structure="currentlist.structure"
              :skellist="currentlist.state.skellist"
              :module="module"
              :editable="state.editableTable"
              @sl-selectionChanged="entrySelected"

    >

    </sl-table>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, computed, provide, onBeforeMount} from 'vue'
import HandlerBar from "../../components/Bars/HandlerBar.vue";
import {ListRequest} from '@viur/viur-vue-utils'
import {useAppStore} from '../../stores/app'
import {useMessageStore} from "../../stores/message";

export default defineComponent({
  props: {
    module: {
      type: String,
      required: true
    },
    group: String,
    view: null
  },
  components: {HandlerBar},
  setup(props, context) {
    const appStore = useAppStore()
    const messageStore = useMessageStore()

    const state = reactive({
      storeName: computed(() => {
        let name: string = `module___${props.module}`
        if (props.view) {
          name += `___${props.view}`
        }
        return name
      }),
      currentSelection: null,
      module: computed(() => props.module),
      group: computed(() => props.group),
      view: computed(() => props.view),
      editableTable:false
    })
    provide("state", state)
    const currentlist = ListRequest(state.storeName, {
      module: props.module,
      params: {},
      group: props.group
    })
    appStore.setListStore(currentlist) //backup access


    function reloadAction() {
      return currentlist.fetch().catch((error) => {
        messageStore.addMessage("error", `${error.message}`, error.response.url)
      }).then((resp) => {
        messageStore.addMessage("success", `Reload`, "Message Test")
      })
    }

    provide("reloadAction", reloadAction)

    onBeforeMount(() => {
      currentlist.fetch().catch((error) => {
        messageStore.addMessage("error", `${error.message}`, error.response.url)
      })
    })

    function entrySelected(e: Event) {
      state.currentSelection = e.detail.data
      if (e.detail.data.length > 0) {
        appStore.state['skeldrawer.entry'] = e.detail.data[e.detail.data.length - 1]
        appStore.state['skeldrawer.structure'] = currentlist.structure
      } else {
        appStore.state['skeldrawer.entry'] = {}
        appStore.state['skeldrawer.structure'] = {}
      }

    }

    return {
      state,
      currentlist,
      entrySelected
    }
  }
})
</script>

<style scoped lang="less">
.table {
  width: 100%;
  table-layout: fixed;

  tbody tr {
    position: relative;
    transition: all ease .3s;

    &:nth-child(odd) {
      background-color: #f3f3f3;
    }

    &:hover {
      background-color: rgba(22, 159, 172, .25);
    }
  }
}

thead {
  background-color: var(--sl-color-primary-500);
  color: #fff;

  th {
    padding: 10px 15px;
    resize: horizontal;
    overflow: hidden;

    &::-webkit-resizer {
      border-style: solid;
      border-width: 0 0px 100px 100px;
      border-color: transparent transparent rgba(255, 255, 255, .2) transparent;
      display: block;
      transition: all ease .3s;
    }

    &:hover {
      &::-webkit-resizer {
        border-color: transparent transparent rgba(255, 255, 255, .9) transparent;
      }
    }

    :deep(sl-icon) {
      height: .5em;
      padding-top: .5em;
      float: right;
    }

  }
}

sl-table-wrapper {
  width: 100%;
}

img {
  width: 4em;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  object-position: center;
  background-color: var(--sl-color-neutral-200);

  &:hover {
    object-fit: contain;
  }
}

.cell-wrap {
  display: flex;
  flex-direction: row;
  padding-bottom: 20px;
  height: 100%;
  width: 100%;
}

.info-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 7px 15px;

  .headline {
    font-size: 1.2em;
    line-height: 1.2;
  }

  sl-tag {
    margin-bottom: 10px;
  }
}


td {
  height: 1px;
  max-width: 5px;
  overflow: hidden;
  word-wrap: break-word;
}

th {
  cursor: pointer;

  &.thimg {
    width: 4em;
  }

  &.thbutton {
    width: 91px;
  }

  .th-inner {
    float: left;
    max-width: calc(100% - 1.3em);
  }

  sl-icon {
    height: 1em;
    font-size: .7em;
    margin-left: 0.8em;
  }

}

.dataset-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.padding-cell {
  padding: 10px 15px;
  vertical-align: middle;
}
</style>
