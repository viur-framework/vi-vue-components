<template>
  <sl-breadcrumb>
    <sl-breadcrumb-item v-for="(entry,idx) in state.selectedEntries" @click="changePath(idx)" :key="idx">
      {{ entry["name"] }}
    </sl-breadcrumb-item>
  </sl-breadcrumb>

  <sl-split-panel position-in-pixels="250" snap="250px">
    <div class="tree-wrapper"
         slot="start"
    >
      <ul>
        <tree-folder-item :module="module" :path="rootnode?[0]:[]"></tree-folder-item>
      </ul>
    </div>

    <sl-split-panel style="--max: 70%" slot="end">
      <div slot="start" class="start-slot">
        <slot :nodes="state.currentEntry?.['_nodes']" :leafs="state.currentEntry?.['_leafs']">
          <sl-table-wrapper  :search="filter" sortable class="scroller">
            <table ref="currentTable" class="table">
              <thead>
              <tr>
                <th>
                  <div class="th-inner">Dateiname</div>
                </th>
                <th>
                  <div class="th-inner">Erstellungsdatum</div>
                </th>
                <th>
                  <div class="th-inner">Änderungsdatum</div>
                </th>
              </tr>
              </thead>
              <tbody>
                <template v-for="(skel,idx) in state.currentEntry?.['_nodes']" :key="skel['key']">
                    <folder-item :module="module" :skel="skel" :idx="idx" :path="state.selectedPath"></folder-item>
                </template>

                <template v-for="(skel,idx) in state.currentEntry?.['_leafs']" :key="skel['key']">
                  <file-item :module="module" :skel="skel" :idx="idx" :path="state.selectedPath"></file-item>
                </template>

                <tr v-if="state.loading">
                  <td colspan="3"><sl-spinner></sl-spinner></td>
                </tr>

                <tr v-if="(!state.currentEntry?.['_nodes'] || state.currentEntry?.['_nodes'].length===0) &&  (!state.currentEntry?.['_leafs'] ||state.currentEntry?.['_leafs'].length===0 )">
                  <td colspan="3">
                    <sl-alert variant="info" open class="alert">
                      <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
                      <strong>Keine Einträge</strong>
                    </sl-alert>
                   </td>
                </tr>

              </tbody>
            </table>
          </sl-table-wrapper>
        </slot>
      </div>

      <div class="file-info" v-if="state.selected_leaf?.name" slot="end">
        <slot :selection="state.selected_leaf" name="details">
          <div class="headline" v-html="state.selected_leaf.name"></div>
          <div class="file-preview" @click="openFileNewTab(state.selected_leaf)">
            <vi-image v-if="state.selected_leaf?.mimetype && state.selected_leaf?.mimetype.startsWith('image/')"
                      :src="Request.downloadUrlFor({'dest': state.selected_leaf},true)">
            </vi-image>
          </div>
          <div class="details">
            <span class="details-name">Hochgeladen am:</span>
            <sl-format-date year="numeric" month="numeric" day="2-digit"
                            :date="state.selected_leaf.creationdate"></sl-format-date>
          </div>
          <div class="details">
            <span class="details-name">Letzte Änderung am:</span>
            <sl-format-date year="numeric" month="numeric" day="2-digit"
                            :date="state.selected_leaf.changedate"></sl-format-date>
          </div>
          <div class="details">
            <span class="details-name">Größe:</span>
            <sl-format-bytes class="download-size" :value="state.selected_leaf['size']"></sl-format-bytes>
          </div>
          <div class="details">
            <span class="details-name">Mimetype:</span>
            {{ state.selected_leaf.mimetype }}
          </div>
        </slot>
      </div>
    </sl-split-panel>

  </sl-split-panel>


</template>

<script lang="js">
import {reactive, defineComponent, computed, provide, onBeforeMount, watch} from 'vue'
import {Request} from "@viur/viur-vue-utils";
import TreeFolderItem from "@/components/Tree/TreeFolderItem.vue";
import ViImage from "@/components/Generic/Image.vue";
import useTree from "@/components/Tree/tree.js";
import FolderItem from "@/components/Tree/FolderItem.vue";
import FileItem from "@/components/Tree/FileItem.vue";

export default defineComponent({
  props: {
    module: {
      type: String,
      required: true
    },
    rootnode: {
      // type: String,
      required: true
    },
    view: null,
    dragging:false
  },
  components: {FileItem, FolderItem, ViImage, TreeFolderItem},
  setup(props, context) {
    const state = reactive({
      tree: [],
      selected_leaf: null,
      selectedPath: [],
      selectedEntries: computed(() => {
        let retVal = []
        let entry = state.tree
        let x = 0
        for (let i of state.selectedPath) {
          if (Array.isArray(entry)) {
            entry = entry[i]
            if (!entry) break;
            entry["_expanded"] = true
            retVal.push(entry)
          }
          if (state.selectedPath.length - 1 !== x && Object.keys(entry).includes("_nodes")) {
            entry = entry["_nodes"]
          }
          x += 1
        }
        return retVal
      }),
      draggedEntry: null,
      currentEntry:computed(()=>{
        return tree.EntryFromPath(state.selectedPath)
      }),
      current_nodes: [], // holds our entries
      current_leaves: [], // holds our entries
      refreshList: false,
      dragging:computed(()=>props.dragging),
      loading:false
    })
    provide("state", state) // expose to components

    const tree = useTree(props.module,state,state)

    //update if path changes
    watch(() => state.selectedPath, (newVal, oldVal) => {
      if (newVal.toString() !== oldVal.toString()) {
        fetchAll();
      }
    })

    //update if marked as needs update
    watch(() => state.refreshList, (newVal, oldVal) => {
      if (newVal) {
        fetchAll()
        state.refreshList = false
      }
    })

    // init tree
    onBeforeMount(() => {
      state.tree = [props.rootnode]
      state.selectedPath = [0]
    })

    //breadcrumb navigation
    function changePath(idx) {
      state.selected_leaf = null
      state.selectedPath.splice(idx + 1, state.selectedPath.length - (idx + 1))
      fetchAll();
    }

    function fetchAll() {
      state.loading=true
      fetch("node");
      fetch("leaf");
      state.loading=false;
    }

    /**
     * Fetch nodes and leafs
     * @param skelType
     * @returns {Promise<Response>|number}
     */
    function fetch(skelType) {
      let parent_entry_key = state.selectedEntries.at(-1)?.["key"]
      if (!parent_entry_key) return 0

      return Request.list(props.module, {
        dataObj: {
          "parententry": parent_entry_key,
          "skelType": skelType,
          "orderby": "sortindex",
          "amount": 99
        },
      }).then(async (resp) => {
        let data = await resp.json()

        state.request_state = parseInt(resp.status)
        state.cursor = data["cursor"]
        if (skelType === "node") {
          state.currentEntry["_nodes"] = data["skellist"]
        } else {
          state.currentEntry["_leafs"] = data["skellist"]
        }

      }).catch((error) => {
        if (error.response) {
          state.request_state = parseInt(error.response.status)
        } else {
          state.request_state = 501
        }
        throw error
      })
    }


    return {
      state,
      Request,
      changePath
    }
  }
})
</script>

<style lang="less" scoped>

sl-breadcrumb{
  padding: 7px 10px;
  border-bottom: 2px solid var(--sl-color-neutral-200);

  .mq-max(@breakSmall,{
	margin-bottom: 10px;
  });
}

sl-breadcrumb-item{

  &::part(base){
  	font-weight: 400;
	color: var(--sl-color-primary-500)
  }

  &::part(separator){
	font-size: .5em;
  }
}

sl-split-panel {
  --min: 250px;
  --divider-width: 1px;
  height: 0;
  flex: 1;

  &::part(panel) {
    display: flex;
    flex-direction: column;
  }

  .mq-max(@breakSmall,{
	display: flex;
	flex-direction: column;
	gap: 10px;

	&::part(start){
	  display: none;
	}
  });
}

.tree-wrapper {
  overflow-y: auto;

  &::-webkit-scrollbar-track {
	  background-color: transparent;
  }

  &::-webkit-scrollbar {
	  width: 4px;
	  height: 4px;
	  background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
	  background-color: #afafaf;
	  border-radius: 3px;
  }
}

.table {
  width: 100%;
  table-layout: fixed;
}

th {
  cursor: pointer;
  padding: 6px 8px;
  resize: horizontal;
  overflow: hidden;


  :deep(sl-icon) {
    height: .4em;
    padding-top: .5em;
    color: @textColor;
  }

  &.thimg {
    width: 4em;
  }

  &.thbutton {
    width: 91px;
  }

  .th-inner {
    float: left;
    max-width: calc(100% - 1.3em);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
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

sl-format-date {
  float: left;
  max-width: calc(100% - 1.3em);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.file-info {
  display: flex;
  flex-direction: column;
  padding: 7px 15px;
  overflow-y: auto;

  .headline {
    word-break: break-word;
    margin-bottom: 10px;
  }

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }

  &::-webkit-scrollbar {
    width: 5px;
    height: 5px;
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #afafaf;
    border-radius: 3px;
  }
}

.file-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  margin-bottom: 10px;
}

.file-preview {
  cursor: pointer;
  margin-bottom: 10px;
}

.details {
  margin-bottom: 10px;
}


.details-name {
  display: block;
  font-weight: 700;
}

.breadcrumbs {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: nowrap;
  border: 1px solid var(--sl-color-neutral-200);
  margin-bottom: 10px;
  border-radius: var(--sl-border-radius-medium);


  ul {
    display: flex;
    flex-wrap: nowrap;
    flex: 1;
    list-style: none;
    margin: 0;
    padding: 0;
    font-weight: 600;
    color: @complementColor;
    font-size: .9em;
    overflow-x: auto;

    &::-webkit-scrollbar-track {
      background-color: transparent;
    }

    &::-webkit-scrollbar {
      width: 4px;
      height: 4px;
      background-color: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background-color: transparent;
      border-radius: 3px;
    }

    &:hover {
      &::-webkit-scrollbar-thumb {
        background-color: #afafaf;
      }
    }
  }

  li {
    cursor: pointer;
    padding: 6px 8px;
    transition: all ease .3s;
    white-space: nowrap;

    &:hover {
      background-color: var(--sl-color-neutral-100);
    }

    &:not(:last-child)::after {
      display: inline-block;
      margin: 0 0 0 8px;
      content: "\203A";
    }
  }
}

.start-slot{
  display: contents;
}

.scroller {
  height: 1px;
  flex: 1;
  overflow-y: auto;

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }

  &::-webkit-scrollbar {
    width: 5px;
    height: 5px;
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #afafaf;
    border-radius: 3px;
  }
}

.alert{
  margin: 10px 5px;

  &::part(icon){
    padding: 15px 0px 15px 15px;
  }

  &::part(message){
    padding: 15px;
  }
}

</style>
