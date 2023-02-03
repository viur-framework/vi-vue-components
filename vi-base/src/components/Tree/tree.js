import {Request} from "@viur/viur-vue-utils";

export default function useTree(module, treeState, state){
    function mouseDownHandle(e, idx) {
        console.log(state.currentEntry)
      state.currentEntry['_nodes'][idx]["_dragging"] = true
    }

    function mouseUpHandle(e, idx) {
      state.currentEntry['_nodes'][idx]["_dragging"] = false
    }

    function onDragStart(e, idx) {
      treeState.draggedEntry = {
        "entry": state.currentEntry['_nodes'][idx],
        "idx": idx,
        "parent": state.currentEntry
      }
    }

    function onDragEnter(e, idx) {
      state.currentEntry['_nodes'][idx]["_isover"] = true
      state.currentEntry['_nodes'][idx]["_drop"] = null
    }

    function onDragOver(e, idx) {
      state.currentEntry['_nodes'][idx]["_isover"] = true
      e.dataTransfer.dropEffect = 'move';

      let elem = e.target.closest(".entry")

      if (parseInt(e.offsetY) < 5) {
        state.currentEntry['_nodes'][idx]["_drop"] = 'before'
      } else if (parseInt(elem.clientHeight) / 2 > parseInt(e.offsetY)) {
        state.currentEntry['_nodes'][idx]["_drop"] = 'in'
      } else {
        state.currentEntry['_nodes'][idx]["_drop"] = 'after'
      }
    }

    function onDragLeave(e, idx) {
      state.currentEntry['_nodes'][idx]["_isover"] = false
      state.currentEntry['_nodes'][idx]["_drop"] = null
    }

    function onDrop(e, idx) {
      //move element
      if (state.currentEntry['_nodes'][idx]["_drop"] === 'after') {
        treeState.draggedEntry["parent"]['_nodes'].splice(treeState.draggedEntry["idx"], 1) // remove old one
        state.currentEntry['_nodes'].splice(idx + 1, 0, treeState.draggedEntry["entry"]) //add a copy

        let sortidx = state.currentEntry['_nodes'][idx]['sortindex'] + 1
        if (state.currentEntry['_nodes'].length-1 !== idx){
           sortidx = (state.currentEntry['_nodes'][idx]['sortindex'] + state.currentEntry['_nodes'][idx+1]['sortindex']) /2
        }


        EntryMoved(treeState.draggedEntry["entry"], sortidx, state.currentEntry["key"])

      } else if (state.currentEntry['_nodes'][idx]["_drop"] === 'before') {
        treeState.draggedEntry["parent"]['_nodes'].splice(treeState.draggedEntry["idx"], 1) // remove old one

        state.currentEntry['_nodes'].splice(idx, 0, treeState.draggedEntry["entry"]) //add a copy


        let sortidx = state.currentEntry['_nodes'][idx]['sortindex'] - 1

        if (idx !== 0){
           sortidx = (state.currentEntry['_nodes'][idx]['sortindex'] + state.currentEntry['_nodes'][idx-1]['sortindex']) /2
        }

        EntryMoved(treeState.draggedEntry["entry"], sortidx, state.currentEntry["key"])

      } else if (state.currentEntry['_nodes'][idx]["_drop"] === 'in') {

        treeState.draggedEntry["parent"]['_nodes'].splice(treeState.draggedEntry["idx"], 1) // remove old one
        if (state.currentEntry['_nodes'][idx]['_status'] === 'loaded') {
          state.currentEntry['_nodes'][idx]['_nodes'].push(treeState.draggedEntry["entry"]) //add a copy
        }else{
          requestChildren(idx).then(() =>
            state.currentEntry['_nodes'][idx]['_nodes'].push(treeState.draggedEntry["entry"]) //add a copy
          )
        }
        EntryMoved(treeState.draggedEntry["entry"], new Date().getTime(), state.currentEntry['_nodes'][idx]["key"])
      }

      //cleaning
      state.currentEntry['_nodes'][idx]["_isover"] = false
      state.currentEntry['_nodes'][idx]["_drop"] = null
      state.currentEntry['_nodes'][idx]["_dragging"] = false
    }

    function EntryMoved(entry, idx, newparent, entrytype="node") {
      if (newparent) {
        Request.securePost(`/vi/${module}/move`, {
          dataObj: {
            "parentNode": newparent,
            "key": entry["key"],
            "sortindex": idx,
            "skelType": entrytype
          }
        }).then((resp)=>{
          treeState.refreshList=true
        })
      } else {
        Request.edit(module, entry["key"], {
          dataObj: {
            "sortindex": idx,
            "skelType": entrytype
          }
        }).then((resp)=>{
          treeState.refreshList=true
        })
      }
    }

    function requestChildren(idx, entryType="node") {
      state.currentEntry['_nodes'][idx]['_status'] = 'loading'
      return Request.get(`/vi/${module}/list`, {
        dataObj: {
          "skelType": entryType,
          "orderby": "sortindex",
          "parententry": state.currentEntry['_nodes'][idx]["key"]
        }
      }).then(async (resp) => {
        let data = await resp.json()

        state.currentEntry['_nodes'][idx]['_nodes'] = data["skellist"]
        state.currentEntry['_nodes'][idx]['_disabled'] = !data["skellist"].length > 0
        state.currentEntry['_nodes'][idx]['_status'] = 'loaded'
        state.currentEntry['_nodes'][idx]['_dragging'] = false
        state.currentEntry['_nodes'][idx]['_isover'] = false
        state.currentEntry['_nodes'][idx]['_drop'] = null
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
        mouseDownHandle,
        mouseUpHandle,
        onDragStart,
        onDragEnter,
        onDragOver,
        onDragLeave,
        onDrop,
        EntryMoved,
        EntryFromPath,
        requestChildren
    }
}
