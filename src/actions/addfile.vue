<template>
  <template v-if="state.canAdd">
    <sl-button-group>
      <sl-button
        :disabled="state.disabled"
        variant="success"
        size="small"
        @click="fileUpload"
      >
        <sl-spinner
          v-if="state.loading"
          slot="prefix"
          style="--indicator-color: white"
        ></sl-spinner>
        <sl-icon
          v-else
          slot="prefix"
          :name="itemMeta(null, 'leaf').icon"
          :library="itemMeta(null, 'leaf').library"
          sprite
        ></sl-icon>
        {{ itemMeta(null, "leaf").name }} {{ $t("actions.add") }}
      </sl-button>
      <sl-dropdown placement="bottom-end">
        <sl-button
          slot="trigger"
          :disabled="state.disabled"
          variant="success"
          size="small"
          caret
        ></sl-button>
        <sl-menu>
          <sl-menu-item @click="fileUpload">
            <sl-icon
              slot="prefix"
              :name="itemMeta(null, 'leaf').icon"
              :library="itemMeta(null, 'leaf').library"
              sprite
            ></sl-icon>
            {{ itemMeta(null, "leaf").name }} {{ $t("actions.add") }}
          </sl-menu-item>
          <sl-menu-item @click="folderUpload">
            <sl-icon
              slot="prefix"
              :name="itemMeta(null, 'node').icon"
              :library="itemMeta(null, 'node').library"
              sprite
            ></sl-icon>
            {{ itemMeta(null, "node").name }} {{ $t("actions.add") }}
          </sl-menu-item>
        </sl-menu>
      </sl-dropdown>
    </sl-button-group>
  </template>
  <sl-button
    v-else
    size="small"
    variant="success"
    disabled
    :title="$t('actions.addfile')"
  >
    <sl-icon
      slot="prefix"
      name="plus-lg"
    ></sl-icon>
    {{ $t("actions.addfile") }}
  </sl-button>
  <input
    ref="fileinput"
    type="file"
    multiple
    style="display: none"
    @change="fileuploaded"
  />

  <input
    ref="fileinputfolders"
    type="file"
    multiple="multiple"
    webkitdirectory
    style="display: none"
    @change="folderUploaded"
  />
</template>

<script setup>
import { reactive, defineComponent, inject, computed, ref } from "vue"
import { useDBStore } from "../stores/db"
import { useUserStore } from "@viur/vue-utils/login/stores/user"
import { useRoute } from "vue-router"
import { Request } from "@viur/vue-utils"
import { useMessageStore } from "../stores/message"


    const handlerState = inject("handlerState")
    const tableReload = inject("reloadAction")
    const itemMeta = inject("itemMeta")
    const messageStore = useMessageStore()
    const dbStore = useDBStore()
    const userStore = useUserStore()
    const route = useRoute()
    const fileinput = ref()
    const fileinputfolders = ref()

    const state = reactive({
      file: null,
      inputRef: null,
      inputFolderRef: null,
      canAdd: computed(() => {
        if (userStore.state.user.access.indexOf("root") !== -1) {
          return true
        }
        return userStore.state.user.access.indexOf(`${handlerState.module}-add`) > -1
      }),
      total: 0,
      uploaded: 0,
      loading: false,
      disabled: false
    })

    function fileUpload(e) {
      fileinput.value.click()
    }

    function folderUpload(e) {
      fileinputfolders.value.click()
    }

    function fileuploaded(e) {
      state.file = e.target.files

      let targetnode = handlerState.currentPath.slice(-1)[0]?.["key"]

      state.total = state.file.length

      if (state.total > 0) {
        state.loading = true
      } else {
        state.loading = false
      }
      for (let f of state.file) {
        let dataObj = {
          fileName: f["name"],
          mimeType: f["type"],
          size: f["size"].toString(),
          node: targetnode
        }
        if (handlerState.currentRootNode?.["public"]){
          dataObj["public"] = true
        }

        Request.securePost(`/vi/${handlerState.module}/getUploadURL`, {
          dataObj: dataObj
        }).then(async (resp) => {
          let data = await resp.json()
          fetch(data["values"]["uploadUrl"], {
            method: "POST",
            body: f,
            mode: "no-cors"
          }).then((resp) => {
            Request.add(handlerState.module, {
              dataObj: {
                key: data["values"]["uploadKey"],
                skelType: "leaf"
              }
            }).then(() => {
              state.uploaded += 1
              if (state.uploaded === state.total) {
                fileinput.value.value = null
                state.loading = false
                state.uploaded = 0
                tableReload(true)
                messageStore.addMessage("success", `File`, "Entry created")
              }
            }).catch((error) => {console.log(error)})
          })
        })
      }
    }

    async function GetOrCreateFolderTree(path, folderMap) {
      path = path.substring(0, path.lastIndexOf("/")) //drop file at the end

      //skip existing paths
      if (Object.keys(folderMap).includes(path)) {
        return [{}, folderMap[path]]
      }

      let parent = handlerState.currentPath.slice(-1)[0]?.["key"]

      let currentpath = []

      for (const p of path.split("/")) {
        currentpath.push(p)
        let current = currentpath.join("/")
        //skip existing path parts
        if (Object.keys(folderMap).includes(current)) {
          parent = folderMap[current]
          continue
        }

        //create folder and update map
        let resp = await createFolder(p, parent)
        resp = await resp.json()
        folderMap[current] = resp["values"]["key"]
        parent = resp["values"]["key"]
      }
      return [folderMap, parent]
    }

    async function folderUploaded(event) {
      state.file = event.target.files
      state.total = state.file.length
      let currentNodes = {}
      state.loading = true
      let targetnode = handlerState.currentPath.slice(-1)[0]?.["key"]

      let publicupload = false
      if (handlerState.currentRootNode?.["public"]){
          publicupload = true
      }
      for (let f of state.file) {
        let [folderMap, parent] = await GetOrCreateFolderTree(f["webkitRelativePath"], currentNodes)
        currentNodes = { ...currentNodes, ...folderMap }
        Request.uploadFile(f, parent, publicupload)
          .then((resp) => {
            state.uploaded += 1
            if (state.uploaded === state.total) {
              state.uploaded = 0
              state.total = 0
              fileinputfolders.value.value = null
              state.loading = false
              tableReload(true)
              messageStore.addMessage("success", `File`, "Entry created")
            }
          })
          .catch((error) => {console.log(error)})
      }
    }

    function createFolder(name, parent) {
      return Request.add("file", {
        dataObj: {
          name: name,
          skelType: "node",
          node: parent
        }
      })
    }

</script>

<style scoped></style>
