<template>
  <div class="main-wrapper">
    <handler-bar :module="module"></handler-bar>
    <sl-table moveablerows
              rowselect
              :structure="state.structure"
              :nodes='state.nodes'
              :module="state.module"
              height="100%"
              mode="hierarchy"
              @table-fetchNodes="fetchNodesEvent"
              @table-rowMovedDataTree="rowMovedDataTree"
              @table-newSortIndex="newSortIndex"
              @table-move_and_SortIndex="move_and_SortIndex"
              @sl-selectionChanged="entrySelected"


    ></sl-table>
    <div class="more-entries">
       <sl-button size="small">
              <sl-icon slot="prefix" aria-hidden="true" library="default" v-once name="arrow-repeat"></sl-icon>
              Filtern
          </sl-button>
          <sl-button size="small">
              <sl-icon slot="prefix" aria-hidden="true" library="default" v-once name="arrow-repeat"></sl-icon>
              Weitere Einträge
          </sl-button>
          <sl-select size="small" label="Anzahl">
            <sl-option value="1">30</sl-option>
            <sl-option value="2">60</sl-option>
            <sl-option value="3">90</sl-option>
          </sl-select>
          <sl-button size="small">
              <sl-icon slot="prefix" aria-hidden="true" library="default" v-once name="arrow-repeat"></sl-icon>
              Neuladen
          </sl-button>
    </div>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import {
  reactive,
  defineComponent,
  computed,
  provide,
  onBeforeMount,
  watch,
  toRaw,
  onActivated,
  onDeactivated
} from 'vue'
import HandlerBar from "../../components/Bars/HandlerBar.vue";
import {Request} from '@viur/viur-vue-utils'
import {useDBStore} from '../../stores/db'
import {useRoute} from "vue-router";
import {useUserStore} from "../../stores/user";


export default defineComponent({
  props: {
    module: {
      type: String,
      required: true
    },
    view: null
  },
  emits:['currentSelection'],
  components: {HandlerBar},
  setup(props, context) {
    const dbStore = useDBStore();
    const userStore = useUserStore();
    const route = useRoute();

    const state = reactive({
      type:"hierarchyhandler",
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
      structure: {},
      active:false
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
        const conf = dbStore.getConfByRoute(route);
        conf["rootNode"] = data[0];
        fetchNodes(state.currentRootNode["key"]);

      }).catch((error)=>{
              if(error.statusCode === 401) userStore.updateUser()
            })
    }

    function fetchStructure() {
      return Request.getStructure(props.module).then(async (resp) => {
        let data = await resp.json();
        data = data["viewNodeSkel"];

        if (Array.isArray(data)) {
          let struct = {};
          for (const idx in data) {
            struct[data[idx][0]] = data[idx][1];
          }
          state.structure = struct;
        }else{
          state.structure = data;
        }

      }).catch((error)=>{
              if(error.statusCode === 401) userStore.updateUser()
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

      context.emit("currentSelection", state.currentSelection)

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


      }).catch((error)=>{
              if(error.statusCode === 401) userStore.updateUser()
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


      }).catch((error)=>{
        if(error.statusCode === 401) userStore.updateUser()
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

    onActivated(()=>{
      state.active = true

      if (dbStore.getActiveTab()["update"]){
        reloadAction()
         dbStore.getActiveTab()["update"]=false
      }

    })

    onDeactivated(()=>{
      state.active = false
    })

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

.main-wrapper{
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 0;
  position: relative;
}

.more-entries{
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 15px;
  padding: 10px;
  background-color: var(--vi-label-background-color);
  border: 1px solid var(--sl-color-neutral-300);
  border-radius: var(--sl-border-radius-medium);
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
}

sl-select{
  &::part(form-control){
    flex-direction: row;
    align-items: center;
  }

  &::part(form-control-label){
    margin-right: 10px;
    font-size: .8em;
  }

  &::part(form-control-input){
    width: 80px;
  }

}


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
