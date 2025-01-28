import { useDBStore } from "../stores/db"
import { useContextStore } from "../stores/context"
import { useMessageStore } from "../stores/message"
import SortindexView from "../bones/sortindexView.vue"
import { ListRequest, destroyStore, boneLogic, Request } from "@viur/vue-utils"
import { onMounted, watch, onUnmounted, computed, reactive, unref } from "vue"
import BoneView from "../bones/boneView.vue"
import { useRoute, useRouter } from "vue-router"

export function useHandlerLogic(props, handler_state) {
  const dbStore = useDBStore()
  const contextStore = useContextStore()
  const messageStore = useMessageStore()
  const router = useRouter()

  const time = new Date().getTime()
  let currentConf = dbStore.getConf(props.module, props.view) //needed
  let currentNodeList = ListRequest(props.module + "_node_handler" + time, { module: props.module,cached:true })
  let currentlist = ListRequest(props.module + "_handler" + time, { module: props.module,cached:true  })
  let currentHandlers = {}

  const state = reactive({
    state: computed(() => {
      let currentState = 0
      for (const handler of [currentlist, currentNodeList]) {
        if (handler?.state?.state === -1) {
          return 0
        }
        currentState = Math.max(handler?.state.state, currentState)
      }
      return currentState
    })
  })

  patch_listRequest(currentlist)
  currentHandlers["leaf"] = currentlist
  if (currentConf["handlerComponent"] === "treehandler") {
    currentHandlers["node"] = currentNodeList

    //set some defaultparams
    currentlist.state.params = { skelType: "leaf", orderby: "sortindex", limit: 99 }
    currentNodeList.state.params = { skelType: "node", orderby: "sortindex", limit: 99 }
    patch_listRequest(currentNodeList)
  }

  onUnmounted(() => {
    for (const [type, handler] of Object.entries(currentHandlers)) {
      destroyStore(handler)
    }
  })

  function patch_listRequest(handler) {
    handler.state.renderedSkellist = computed(() => {
      return handler.state.skellist.map((skel) => {
        let vSkel = {}
        for (const [k, v] of Object.entries(skel)) {
          vSkel[k] = getTextWidget(skel, k, handler).toString()
        }
        return vSkel
      })
    })
  }

  function fetchRoots(update = true) {
    let context = contextStore.getCurrentContext()
    return Request.get(`/vi/${props.module}/listRootNodes`, {cached:true})
      .then(async (resp) => {
        let data = await resp.json()
        handler_state.availableRootNodes = data

        let contextKeys = Object.keys(context)
        if (contextKeys.includes("parentrepo")) {
          handler_state.currentRootNode = data.filter((i) => i["key"] === context["parentrepo"])?.[0]
        } else if (contextKeys.includes("@rootNode")) {
          handler_state.currentRootNode = data.filter((i) => i["key"] === context["@rootNode"])?.[0]
          if (!handler_state.currentRootNode){
            handler_state.currentRootNode = data[0]
          }
        } else if (update) {
          handler_state.currentRootNode = data[0]
        }
        if (!handler_state.currentRootNode) {
          handler_state.currentRootNode = null
        } else {
          handler_state.currentPath = [handler_state.currentRootNode]
        }
      })
      .catch((error) => {
        if (error.statusCode === 401) userStore.updateUser()
      })
  }

  /*Fetch data of one skeltype */
  function fetchData(skelType = "leaf") {
    return currentHandlers[skelType].fetch()
  }
  /* Fetch data of all skeltypes */
  function fetchAllData() {
    for (const [type, handler] of Object.entries(currentHandlers)) {
      fetchData(type)
    }
  }

  function reloadAction(params = {}, all = false) {
    if (handler_state.availableRootNodes.length === 0 || all || handler_state.needUpdate) {
      return new Promise((resolve, reject) => {
        let requestPromises = []
        fetchRoots(!all).then((resp) => {
          handler_state.needUpdate = false

          for (const [type, handler] of Object.entries(currentHandlers)) {
            let aPromise = new Promise((resolve, reject) => {
              handler.reset()
              handler
                .filter({
                  ...handler.state.params,
                  ...contextStore.getContext(),
                  parententry: handler_state.currentPath.slice(-1)[0]?.["key"],
                  ...params,
                })
                .catch((error) => {
                  if (error.code !== 20 && typeof(error)!=='string'){
                    messageStore.addMessage("error", `${error.message}`, error.response?.url)
                  }
                  console.log(error)
                  reject()
                })
                .then((resp) => {
                  resolve()
                })
            })
            requestPromises.push(aPromise)
          }
          Promise.all(requestPromises).then((resp) => {
              resolve()
            //messageStore.addMessage("success", `Reload`, "Liste neu geladen")
          }).catch((error) => {
              reject()
          })
        })
      })
    } else {
      let requestPromises = []
      for (const [type, handler] of Object.entries(currentHandlers)) {
        let aPromise = new Promise((resolve, reject) => {
          handler.reset()
          handler
            .filter({ ...handler.state.params, ...params, ...contextStore.getContext() })
            .catch((error) => {
              if (error.statusCode !== 20){
                messageStore.addMessage("error", `${error.message}`, error.response?.url)
              }
              reject()
            })
            .then((resp) => {
              resolve()
            })
        })
        requestPromises.push(aPromise)
      }

      return Promise.all(requestPromises).then((resp) => {
        //messageStore.addMessage("success", `Reload`, "Liste neu geladen")
      })
    }
  }

  function limitAction() {
    for (const [type, handler] of Object.entries(currentHandlers)) {
      handler.state.params["limit"] = limit
      handler.reset()
      handler.fetch()
    }
  }

  function nextPageAction() {
    for (const [type, handler] of Object.entries(currentHandlers)) {
      handler.next()
    }
  }

  function filterAction(skel) {
    if (handler_state.filter === null || handler_state.filter === "") return true
    let wordlist = handler_state.filter ? handler_state.filter.split(" ") : []
    for (const [k, v] of Object.entries(skel)) {
      if (currentlist.structure?.[k]?.["visible"] === false) continue
      for (let word of wordlist) {
        word = word.toLowerCase().replace(/[\W_]+/g, "") //remove all nun alphanum chars

        if (!word || word.length === 0) {
        } else {
          if (
            v
              .toLowerCase()
              .replace(/[\W_]+/g, "")
              .includes(word)
          ) {
            return true
          }
        }
      }
    }
    return false
  }

  function sortAction(field, direction) {
    if (field + "$" + direction === handler_state.sorting) {
      return 0
    }
    handler_state.sorting = field + "$" + direction
    if (direction === "asc") {
      currentlist.state.skellist.sort((a, b) => {
        let aValue = a[field] || ""
        let bValue = b[field] || ""

        if (typeof aValue !== "string") {
          aValue = aValue.toString()
        }
        if (typeof bValue !== "string") {
          bValue = bValue.toString()
        }
        if (aValue.toLowerCase() > bValue.toLowerCase()) {
          return 1
        } else {
          return -1
        }
      })
    } else {
      currentlist.state.skellist.sort((a, b) => {
        let aValue = a[field] || ""
        let bValue = b[field] || ""

        if (typeof aValue !== "string") {
          aValue = aValue.toString()
        }
        if (typeof bValue !== "string") {
          bValue = bValue.toString()
        }

        if (aValue.toLowerCase() < bValue.toLowerCase()) {
          return 1
        } else {
          return -1
        }
      })
    }
  }

  function getViewWidget(renderedSkel, name, idx) {
    let bone = currentlist.structure[name]
    if (!bone) return undefined
    let boneType = bone.type

    if (dbStore.state["bones.view"]) {
      if (Object.keys(dbStore.state["bones.view"]).includes(boneType)) {
        //exact match
        return dbStore.state["bones.view"][boneType]
      } else {
        let typeParts = boneType.split(".") //prefix match
        let matchingPrefixes = Object.entries(dbStore.state["bones.view"]).filter((prefix) =>
          prefix[0].startsWith(typeParts[0] + ".")
        )
        if (matchingPrefixes.length > 0) {
          matchingPrefixes.sort((a, b) => b.length - a.length)
          for (let prefix of matchingPrefixes) {
            if (boneType.startsWith(prefix[0])) {
              return dbStore.state["bones.view"][prefix[0]]
            }
          }
        }
      }
    }

    if (boneType==="numeric.sortindex"){
      handler_state.sortindexBonename = name
      return SortindexView
    }

    return BoneView
  }

  function getTextWidget(skel, boneName, handler) {
    const { getBoneValue, bones_state } = boneLogic(skel, handler.structure)
    return getBoneValue(boneName, (skel = skel))
  }

  function openEditor(e) {
    if (props.selector) {
      context.emit("closeSelector", handler_state.currentSelection)
      return 0
    }
    let url = `/db/${props.module}/edit/${handler_state.currentSelection[0]["key"]}`
    if (handler_state.conf["handlerComponent"] === "treehandler") {
      url = `/db/${props.module}/edit/${handler_state.currentSelectionType}/${handler_state.currentSelection[0]["key"]}`
    }

    let route = router.resolve(unref(url))
    dbStore.addOpened(route, props.module, props.view)
  }

  function setSelectedBones() {
    if (props.columns && props.columns.length > 0) {
      handler_state.selectedBones = props.columns
      return 0
    }

    handler_state.conf = dbStore.getConf(props.module, props.view)
    if (handler_state.conf && handler_state.conf?.["columns"] && handler_state.conf?.["columns"].length > 0) {
      handler_state.selectedBones = handler_state.conf["columns"]
    } else {
      let bones = []
      for (const [k, v] of Object.entries(currentlist.structure)) {
        if (v["visible"]) bones.push(k)
      }
      handler_state.selectedBones = bones
    }
  }

  function changeRootNode(key) {
    handler_state.needUpdate = true
    handler_state.currentRootNode = handler_state.availableRootNodes.filter((i) => i["key"] === key)[0]
  }

  return {
    state,
    currentlist,
    currentNodeList,
    currentHandlers,
    fetchAllData,
    fetchData,
    reloadAction,
    nextPageAction,
    getViewWidget,
    sortAction,
    filterAction,
    limitAction,
    getTextWidget,
    openEditor,
    setSelectedBones,
    changeRootNode
  }
}
