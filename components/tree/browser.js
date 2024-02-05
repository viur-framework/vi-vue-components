import { Request } from "@viur/vue-utils"

export default function useTree(module, treeState, state) {
  function requestChildren(idx, entryType = "node") {
    state.currentEntry["_nodes"][idx]["_status"] = "loading"
    return Request.get(`/vi/${module}/list`, {
      dataObj: {
        skelType: entryType,
        orderby: "sortindex",
        parententry: state.currentEntry["_nodes"][idx]["key"],
        ...state.params,
        limit: 99
      }
    }).then(async (resp) => {
      let data = await resp.json()

      state.currentEntry["_nodes"][idx]["_nodes"] = data["skellist"]
      state.currentEntry["_nodes"][idx]["_disabled"] = !data["skellist"].length > 0
      state.currentEntry["_nodes"][idx]["_status"] = "loaded"
      state.currentEntry["_nodes"][idx]["_dragging"] = false
      state.currentEntry["_nodes"][idx]["_isover"] = false
      state.currentEntry["_nodes"][idx]["_drop"] = null
    })
  }
  function EntryFromPath(path) {
    let entry = treeState.tree
    let x = 0
    for (let i of path) {
      if (Array.isArray(entry)) {
        entry = entry[i]
      }

      if (path.length - 1 !== x && Object.keys(entry).includes("_nodes")) {
        entry = entry["_nodes"]
      }
      x += 1
    }
    return entry
  }

  return {
    EntryFromPath,
    requestChildren
  }
}
