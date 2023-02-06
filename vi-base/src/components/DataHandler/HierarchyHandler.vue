<template>
  <handler-bar :module="module"></handler-bar>
  <sl-table moveablerows
            rowselect
            :structure="state.structure"
            :nodes='state.nodes'
            :module="state.module"
            height="100%"
            mode="hierarchy"
            v-on:table-fetchNodes="fetchNodesEvent"
            v-on:table-rowMovedDataTree="rowMovedDataTree"
            v-on:table-newSortIndex="newSortIndex"
            v-on:table-move_and_SortIndex="move_and_SortIndex"
            v-on:sl-selectionChanged="entrySelected"


  ></sl-table>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, computed, provide, onBeforeMount, watch, toRaw} from 'vue'
import HandlerBar from "../../components/Bars/HandlerBar.vue";
import {Request} from '@viur/viur-vue-utils'
import {useAppStore} from '../../stores/app'
import {useRoute} from "vue-router";


export default defineComponent({
  props: {
    module: {
      type: String,
      required: true
    },
    view: null
  },
  components: {HandlerBar},
  setup(props, context) {
    const appStore = useAppStore();
    const route = useRoute();

    const state = reactive({
      storeName: computed(() => {
        let name: string = `module___${props.module}`
        if (props.view) {
          name += `___${props.view}`
        }
        return name
      }),
      currentSelection: null,
      currentRootNodes: [],
      currentRootNode: null,
      currentNode: null,
      nodes: [],
      module: props.module,
      group: null,
      view: computed(() => props.view),
      structure: {}
    })
    provide("state", state) // expose to components

    fetchRoots();
    fetchStructure();

    function fetchRoots() {
      return Request.get(`/vi/${props.module}/listRootNodes`).then(async (resp) => {
        let data = await resp.json()


        state.currentRootNodes = data;
        state.currentRootNode = data[0]
        state.currentNode = data[0];
        const conf = appStore.getConfByRoute(route);
        conf["rootNode"] = data[0];
        fetchNodes(state.currentRootNode["key"]);

      })
    }

    function fetchStructure() {
      return Request.getStructure(props.module).then(async (resp) => {
        let data = await resp.json();
        data = data["viewNodeSkel"];
        const struct = {};
        for (const idx in data) {

          struct[data[idx][0]] = data[idx][1];
        }
        state.structure = struct;
      })
    }


    function reloadAction() {
      return new Promise((resolve, reject) => {
        fetchNodes(state.currentRootNode.key).then(() => {
          resolve()
        })
          .catch(() => {
            reject()
          })
      })
    }

    provide("reloadAction", reloadAction)


    function entrySelected(e) {
      console.log(e.detail.data)
      if (e.detail.data.length > 0) {
        state.currentSelection = [e.detail.data[0]]
      } else {
        state.currentSelection = [];
      }

    }

    function changeParentEntry(event) {
      state.currentNode = {
        "name": event.detail.selection[0]["dataset"]["name"],
        "key": event.detail.selection[0]["dataset"]["key"]
      }
      currentlistleafs.filter({...currentlistleafs.state.params, ...{"parententry": state.currentNode["key"]}})
    }

    function fetchNodes(key) {

      state.nodes = [];
      return Request.get(`/vi/${props.module}/list/node?parententry=${key}`).then(async (resp) => {
        const data = await resp.json();
        for (const node of data["skellist"]) {
          if (node.hasOwnProperty("childcount")) {
            console.log("has child count", node["childcount"])
            if (node["childcount"] > 0) {
              node["_children"] = [];
            } else if (node["childcount"] === -1) {
              node["_children"] = [];
            }
          } else // "old core"
          {
            node["_children"] = [];
          }


        }
        state.nodes = data["skellist"];


      })
    }

    function fetchNodesEvent(event: CustomEvent) {
      console.log("fetchnode event")
      Request.get(`/vi/${props.module}/list/node?parententry=${event.detail.key}`).then(async (resp) => {
        let data = await resp.json();
        const treeChildren = event.detail.row.getTreeChildren();
        for (const node of data["skellist"]) {
          if (node.hasOwnProperty("childcount")) {
            console.log("has child count", node["childcount"])
            if (node["childcount"] > 0) {
              node["_children"] = [];
            } else if (node["childcount"] === -1) {
              node["_children"] = [];
            }
          } else // "old core"
          {
            node["_children"] = [];
          }
          let found = false;
          for (const child of treeChildren) {
            if (child.getData()["key"] === node["key"]) {
              found = true;
              break
            }
          }
          if (!found) {
            event.detail.row.addTreeChild(node);
          }

        }


      })
    }

    function rowMovedDataTree(e: Event) {

      return Request.securePost(`/vi/${props.module}/move`, {
        dataObj: {
          "skelType": "node",
          "key": e.detail.srcKey,
          "parentNode": e.detail.destKey,
        }
      })
    }

    function newSortIndex(e: Event) {

      return Request.securePost(`/vi/${props.module}/edit`, {
        dataObj: {
          "skelType": "node",
          "key": e.detail.srcKey,
          "sortindex": e.detail.sortindex,
        }
      })
    }

    function move_and_SortIndex(e) {
      console.log("move_and_SortIndex")
      rowMovedDataTree(e).then(() => {
        newSortIndex(e)
      });
    }

    function changerootNode(key: string) {

      fetchNodes(key)
      for (const node of state.currentRootNodes) {
        if (key === node["key"]) {
          state.currentRootNode = node;
          break;
        }
      }


    }

    provide("changerootNode", changerootNode)

    return {
      state,
      entrySelected,
      changeParentEntry,
      fetchNodesEvent,
      rowMovedDataTree,
      newSortIndex,
      move_and_SortIndex
    }
  }
})
</script>

<style scoped lang="less">

sl-split-panel {
  --min: 300px;
  --max: 40%;
  flex: 1;

  &::part(panel) {
    display: flex;
    flex-direction: column;
  }
}

sl-table {
  flex: 1;
  display: flex;
  height: 0;

  &::part(base) {
    margin-top: 0;
    border: none;
    border-radius: 0;
  }
}

</style>
