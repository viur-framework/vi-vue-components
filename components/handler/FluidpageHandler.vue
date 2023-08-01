<template>
  <handler-bar :module="module"></handler-bar>
  <sl-details
    open
    summary="Info"
    v-if="modulesStore.state.loaded && modulesStore.state.modules[module]?.['help_text']"
  >
    {{ modulesStore.state.modules[module]["help_text"] }}
  </sl-details>
  <loader
    size="3"
    v-if="currentlist.state.state === 0"
  >
  </loader>
  <div class="fluid-wrap">
    <template v-for="grid in state.grids">
      <component
        v-if="grid[0] && grid[0]['width'] === 'fullwidth'"
        v-for="contentSkel in grid"
        :is="state.fluidpageElement"
        :skel="contentSkel"
        :key="contentSkel['key']"
        @click="entrySelected(contentSkel)"
        @mouseenter="entrySelected(contentSkel)"
      >
      </component>

      <div
        v-else
        class="fluid-grid"
      >
        <div class="shadow-grid">
          <div v-for="i in 12"></div>
        </div>
        <component
          v-for="contentSkel in grid"
          :is="state.fluidpageElement"
          :skel="contentSkel"
          :key="contentSkel['key']"
          @click="entrySelected(contentSkel)"
          @mouseenter="entrySelected(contentSkel)"
        >
        </component>
      </div>
    </template>
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
  onUpdated,
  onMounted,
  ref,
  watch,
  onActivated,
  onDeactivated,
  unref
} from "vue"
import HandlerBar from "../bars/HandlerBar.vue"
import { ListRequest, Request } from "@viur/vue-utils"
import { useDBStore } from "../stores/db"
import { useMessageStore } from "../stores/message"
import router from "../routes"
import { useModulesStore } from "../stores/modules"
import { useRoute } from "vue-router"
import Loader from "@viur/vue-utils/generic/Loader.vue"

export default defineComponent({
  props: {
    module: {
      type: String,
      required: true
    },
    group: String,
    view: null,
    rowselect: {
      default: true
    }
  },
  emits: ["currentSelection"],
  components: { Loader, HandlerBar },
  setup(props, context) {
    const dbStore = useDBStore()
    const route = useRoute()
    const messageStore = useMessageStore()
    const modulesStore = useModulesStore()

    const tableInst = ref(null)

    const state = reactive({
      type: "fluidpagehandler",
      storeName: computed(() => {
        let name: string = `module___${props.module}`
        if (props.view) {
          name += `___${props.view}`
        }
        name += `___${route.query["_"]}`

        return name
      }),
      currentSelection: null,
      module: computed(() => props.module),
      group: computed(() => props.group),
      view: computed(() => props.view),
      editableTable: false,
      tableInst: computed(() => tableInst),
      active: false,
      grids: computed(() => {
        let contentgrids = []
        let currentgrid = []
        if (currentlist.state.skellist.length > 0) {
          for (const item of currentlist.state.skellist) {
            if (item["width"] === "fullwidth") {
              contentgrids.push(currentgrid)
              contentgrids.push([item])
              currentgrid = []
            } else {
              currentgrid.push(item)
            }
          }
          //write last grid
          contentgrids.push(currentgrid)
        }
        return contentgrids
      }),
      dragCurrentElement: null,
      draggedKeys: [],
      debounceSave: null,
      fluidpageElement: computed(() => dbStore.state["fluidpage.element"])
    })
    provide("handlerState", state)
    const currentlist = ListRequest(state.storeName, {
      module: props.module,
      params: {
        limit: 99,
        "fluidpage.dest.key": route.params["key"]
      },
      group: props.group,
      renderer: "vi"
    })
    dbStore.setListStore(currentlist) //backup access
    provide("currentlist", currentlist)

    function changeOrder(oldkey, newkey) {
      state.draggedKeys = [oldkey, newkey]
      let oldidx = currentlist.state.skellist.findIndex((e) => e["key"] === oldkey)
      let newidx = currentlist.state.skellist.findIndex((e) => e["key"] === newkey)

      let element = currentlist.state.skellist[oldidx]
      currentlist.state.skellist.splice(oldidx, 1)
      currentlist.state.skellist.splice(newidx, 0, element)
    }
    provide("changeOrder", changeOrder)

    function calculateIndex(new_position) {
      let sortIndex = 0.0001
      if (currentlist.state.skellist.length === 0) return sortIndex

      if (new_position === 0) {
        let nextEntry = currentlist.state.skellist[new_position]
        sortIndex = nextEntry["sortindex"] - 1
      } else if (new_position === currentlist.state.skellist.length) {
        let prevEntry = currentlist.state.skellist[new_position - 1]
        sortIndex = prevEntry["sortindex"] + 1
      } else {
        let nextEntry = currentlist.state.skellist[new_position]
        let prevEntry = currentlist.state.skellist[new_position - 1]
        sortIndex = prevEntry["sortindex"] + (nextEntry["sortindex"] - prevEntry["sortindex"]) / 2
      }
      sortIndex += 0.0001
      return sortIndex
    }
    provide("calculateIndex", calculateIndex)

    function updateDragged() {
      let idx = currentlist.state.skellist.findIndex((e) => e["key"] === state.draggedKeys[0])

      let currentEntry = currentlist.state.skellist[idx]
      if (idx === 0) {
        let nextEntry = currentlist.state.skellist[idx + 1]
        currentEntry["sortindex"] = nextEntry["sortindex"] - 1
      } else if (idx === currentlist.state.skellist.length - 1) {
        let prevEntry = currentlist.state.skellist[idx - 1]
        currentEntry["sortindex"] = prevEntry["sortindex"] + 1
      } else {
        let nextEntry = currentlist.state.skellist[idx + 1]
        let prevEntry = currentlist.state.skellist[idx - 1]
        currentEntry["sortindex"] = prevEntry["sortindex"] + (nextEntry["sortindex"] - prevEntry["sortindex"]) / 2
      }
      currentEntry["sortindex"] += 0.0001
      Request.edit(props.module, currentEntry["key"], {
        dataObj: {
          sortindex: currentEntry["sortindex"]
        }
      }).then((resp) => {
        messageStore.addMessage("success", `Edit`, "Entry saved successfully")
      })
    }
    provide("updateDragged", updateDragged)

    function updateWidth(key, width) {
      let currentidx = currentlist.state.skellist.findIndex((e) => e["key"] === key)
      let newEntry = currentlist.state.skellist[currentidx]
      newEntry["width"] = width
      currentlist.state.skellist[currentidx] = newEntry

      if (state.debounceSave) {
        clearTimeout(state.debounceSave)
      }

      state.debounceSave = setTimeout(() => {
        Request.edit(props.module, key, {
          dataObj: {
            width: width
          }
        }).then((resp) => {
          messageStore.addMessage("success", `Edit`, "Entry saved successfully")
        })
      }, 1000)
    }
    provide("updateWidth", updateWidth)

    function reloadAction() {
      return currentlist
        .fetch()
        .catch((error) => {
          messageStore.addMessage("error", `${error.message}`, error.response.url)
        })
        .then((resp) => {
          messageStore.addMessage("success", `Reload`, "Liste neu geladen")
        })
    }

    provide("reloadAction", reloadAction)

    function setLimit(limit: any) {
      currentlist.state.params["limit"] = limit
      currentlist.reset()
      currentlist.fetch()
    }

    provide("setLimit", setLimit)

    onMounted(() => {
      currentlist.fetch().catch((error) => {
        messageStore.addMessage("error", `${error.message}`, error.response.url)
      })
    })

    onActivated(() => {
      state.active = true
      let tabData = dbStore.getTabById(route.query["_"])

      if (tabData?.["update"]) {
        reloadAction()
        tabData["update"] = false
      }
    })

    onDeactivated(() => {
      state.active = false
    })

    function entrySelected(skel) {
      state.currentSelection = [skel]
      context.emit("currentSelection", state.currentSelection)
      dbStore.state["skeldrawer.entry"] = skel
      dbStore.state["skeldrawer.structure"] = currentlist.structure
    }
    provide("entrySelected", entrySelected)

    function openEditor(e: Event) {
      const url = `/db/${state.module}/edit/${e.detail.cell.getRow().getData().key}`
      let route = router.resolve(unref(url))

      dbStore.addOpened(route, state.module, state.view)
    }

    return {
      state,
      currentlist,
      entrySelected,
      openEditor,
      modulesStore,
      tableInst,
      dbStore
    }
  }
})
</script>

<style scoped>
.loader {
  position: absolute;
  width: 100%;
  height: 50%;
}

.fluid-wrap {
  display: grid;
  grid-template-columns: [full-start] minmax(20px, 1fr) [main-start] minmax(0, 1200px) [main-end] minmax(20px, 1fr) [full-end];
  grid-gap: 20px 0;
  padding: 20px 0;
  overflow-x: auto;
  height: 0;
  flex: 1;
}

.fluid-grid {
  display: grid;
  grid-column: main;
  grid-template-columns: repeat(12, minmax(0, 100px));
  grid-gap: 20px;
  position: relative;

  @media print {
    & {
      padding: 0;
      margin: 0;
      display: block;
      flex: none;
      max-width: 210mm;
    }
  }
}

.shadow-grid {
  position: absolute;
  top: -20px;
  left: 0;
  right: 0;
  bottom: -20px;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 100px));
  grid-gap: 20px;
  z-index: 0;

  & > div {
    background-color: var(--sl-color-neutral-50);
  }
}

.fluid-width-fullwidth {
  grid-column: full;
}

.fluid-height-100 {
  height: 100vh;
  overflow-y: hidden;
}

.fluid-height-1-1 {
  aspect-ratio: 1;
}

.fluid-height-16-9 {
  aspect-ratio: 1.7777;
}

.fluid-height-16-10 {
  aspect-ratio: 1.6;
}

.fluid-height-4-3 {
  aspect-ratio: 1.3333;
}

/* Media query */
.fluid-width-12 {
  grid-column: span 12;
}
@media (max-width: 64.95em) {
  .fluid-width-12 {
    grid-column: span 6;
  }
}
@media (max-width: 39.95em) {
  .fluid-width-12 {
    grid-column: span 12;
  }
}
.fluid-width-11 {
  grid-column: span 11;
}
@media (max-width: 64.95em) {
  .fluid-width-11 {
    grid-column: span 6;
  }
}
@media (max-width: 39.95em) {
  .fluid-width-11 {
    grid-column: span 12;
  }
}
.fluid-width-10 {
  grid-column: span 10;
}
@media (max-width: 64.95em) {
  .fluid-width-10 {
    grid-column: span 6;
  }
}
@media (max-width: 39.95em) {
  .fluid-width-10 {
    grid-column: span 12;
  }
}
.fluid-width-9 {
  grid-column: span 9;
}
@media (max-width: 64.95em) {
  .fluid-width-9 {
    grid-column: span 6;
  }
}
@media (max-width: 39.95em) {
  .fluid-width-9 {
    grid-column: span 12;
  }
}
.fluid-width-8 {
  grid-column: span 8;
}
@media (max-width: 64.95em) {
  .fluid-width-8 {
    grid-column: span 6;
  }
}
@media (max-width: 39.95em) {
  .fluid-width-8 {
    grid-column: span 12;
  }
}
.fluid-width-7 {
  grid-column: span 7;
}
@media (max-width: 64.95em) {
  .fluid-width-7 {
    grid-column: span 6;
  }
}
@media (max-width: 39.95em) {
  .fluid-width-7 {
    grid-column: span 12;
  }
}
.fluid-width-6 {
  grid-column: span 6;
}
@media (max-width: 64.95em) {
  .fluid-width-6 {
    grid-column: span 6;
  }
}
@media (max-width: 39.95em) {
  .fluid-width-6 {
    grid-column: span 12;
  }
}
.fluid-width-5 {
  grid-column: span 5;
}
@media (max-width: 64.95em) {
  .fluid-width-5 {
    grid-column: span 6;
  }
}
@media (max-width: 39.95em) {
  .fluid-width-5 {
    grid-column: span 12;
  }
}
.fluid-width-4 {
  grid-column: span 4;
}
@media (max-width: 64.95em) {
  .fluid-width-4 {
    grid-column: span 6;
  }
}
@media (max-width: 39.95em) {
  .fluid-width-4 {
    grid-column: span 12;
  }
}
.fluid-width-3 {
  grid-column: span 3;
}
@media (max-width: 64.95em) {
  .fluid-width-3 {
    grid-column: span 6;
  }
}
@media (max-width: 39.95em) {
  .fluid-width-3 {
    grid-column: span 12;
  }
}
.fluid-width-2 {
  grid-column: span 2;
}
@media (max-width: 64.95em) {
  .fluid-width-2 {
    grid-column: span 6;
  }
}
@media (max-width: 39.95em) {
  .fluid-width-2 {
    grid-column: span 12;
  }
}
.fluid-width-1 {
  grid-column: span 1;
}
@media (max-width: 64.95em) {
  .fluid-width-1 {
    grid-column: span 6;
  }
}
@media (max-width: 39.95em) {
  .fluid-width-1 {
    grid-column: span 12;
  }
}
</style>
