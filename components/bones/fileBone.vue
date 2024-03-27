<template>
  <div
    class="file-wrapper"
    @dragover.prevent="state.droparea = true"
    @dragleave="state.droparea = false"
    @drop.prevent="handleDrop"
  >
    <div
      v-if="state.droparea"
      class="droparea"
    >
      {{$t('bone.dragFile')}}
    </div>
    <sl-button
      v-if="!boneState.readonly && (!value || state.loading)"
      :title="$t('bone.upload')"
      outline
      class="upload-btn"
      variant="success"
      @click="uploadinput.click()"
    >
      <sl-icon
        slot="prefix"
        name="upload"
      ></sl-icon>
      {{ $t("bone.upload") }}
      <sl-spinner-viur
        v-if="state.loading"
        slot="suffix"
      ></sl-spinner-viur>
    </sl-button>
    <sl-button
      v-if="!boneState.readonly && (!value || state.loading)"
      class="relation-btn"
      @click="openRelationalSelection"
      :title="$t('bone.chooseFile')"
    >
      <sl-icon
        slot="prefix"
        name="list-ul"
      ></sl-icon>
    </sl-button>
    <input
      ref="uploadinput"
      hidden
      type="file"
      :multiple="boneState.multiple"
      @change="handleUpload"
    />
    <sl-button
      v-if="value"
      @click="downloadFile"
      :title="$t('bone.download')"
    >
      <sl-icon
        slot="prefix"
        name="download"
      ></sl-icon>
    </sl-button>
    <div
      v-if="!boneState.isEmpty"
      class="box"
    >
      <div
        v-if="value?.['dest']?.['mimetype'].includes('image')"
        class="preview"
      >
        <vi-image
          :src="Request.downloadUrlFor(value)"
          popup
        >
        </vi-image>
      </div>

      <div
        v-else
        class="preview"
      >
        <sl-icon
          v-if="value?.['dest']?.['name']"
          name="file-earmark"
        ></sl-icon>
      </div>
      <div
        v-if="value?.['dest']?.['name']"
        class="ellipsis"
      >
        {{ decodeURIComponent(value?.["dest"]?.["name"]) }}


      </div>
      <sl-button
          v-if="value"
          variant="info"
          outline
          class="edit-btn"
          @click="editSelection"
          :title="$t('bone.editFile')"
        >
          <sl-icon name="pencil-fill"></sl-icon>
        </sl-button>
    </div>
    <sl-button
      v-if="value"
      variant="info"
      outline
      class="info-btn"
      @click="openRelationalSelection"
      :title="$t('bone.chooseFile')"
    >
      <sl-icon name="list-ul"></sl-icon>
    </sl-button>
    <sl-button
      v-if="!boneState.multiple && !boneState.isEmpty"
      :disabled="boneState.readonly"
      variant="danger"
      outline
      :title="$t('bone.del')"
      class="delete-btn"
      @click="$emit('change', name, '', lang, index)"
    >
      <sl-icon
        slot="prefix"
        name="x-lg"
      ></sl-icon>
    </sl-button>
  </div>
  <div class="nested_wrapper">
    <Wrapper_nested
      v-if="boneState?.bonestructure['using']"
      :value="value?.['rel']"
      :name="name"
      :index="index"
      :disabled="boneState.bonestructure['readonly']"
      @change="changeEventNested"
    >
    </Wrapper_nested>
  </div>
  <relational-selector
    :open="state.openedSelection"
    :name="boneState.bonestructure['descr']"
    :tab-id="handlerState.tabId"
    :handler="state.moduleInfo['handlerComponent']"
    :module="boneState?.bonestructure['module']"
    @close="relationCloseAction"
  >
  </relational-selector>
</template>

<script lang="ts">
//@ts-nocheck
import { reactive, defineComponent, onMounted, inject, ref, computed, unref, watch } from "vue"
import { useRouter } from "vue-router"
import { Request } from "@viur/vue-utils"
import relationalSelector from "./components/relationalSelector.vue"
import Wrapper_nested from "@viur/vue-utils/bones/edit/wrapper_nested.vue"
import { useDBStore } from "../stores/db"
import ViImage from "@viur/vue-utils/generic/Image.vue"

export default defineComponent({
  inheritAttrs: false,
  props: {
    name: String,
    value: Object,
    index: Number,
    lang: String
  },
  components: { relationalSelector, Wrapper_nested, ViImage },
  emits: ["change"],
  setup(props, context) {
    const boneState = inject("boneState")
    const handlerState = inject("handlerState")
    const router = useRouter()
    const uploadinput = ref()
    const dbStore = useDBStore()
    const state = reactive({
      loading: false,
      droparea: false,
      openedSelection: false,
      moduleInfo: computed(() => dbStore.getConf(boneState?.bonestructure["module"])),
      selection: null
    })

    onMounted(() => {
      state.selection = props.value
      context.emit("change", props.name, props.value, props.lang, props.index) //init
    })

    function downloadFile() {
      console.log(Request.downloadUrlFor(props.value))
      window.open(Request.downloadUrlFor(props.value))
    }

    function createBackgroundImage() {
      return Request.downloadUrlFor(props.value, false)
    }

    function uploadFile(file) {
      const filedata: Record<string, string> = {
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size.toString()
      }
      return new Promise((resolve, reject) => {
        Request.securePost("/vi/file/getUploadURL", { dataObj: filedata })
          .then(async (resp) => {
            let uploadURLdata = await resp.json()
            fetch(uploadURLdata["values"]["uploadUrl"], {
              body: file,
              method: "POST",
              mode: "no-cors"
            })
              .then(async (uploadresp) => {
                const addData: Record<string, string> = {
                  key: uploadURLdata["values"]["uploadKey"],
                  node: undefined,
                  skelType: "leaf"
                }
                Request.securePost("/vi/file/add", { dataObj: addData })
                  .then(async (addresp) => {
                    let addData = await addresp.json()
                    if (addData["action"] === "addSuccess") {
                      resolve(addData["values"])
                    } else {
                      reject(addData)
                    }
                  })
                  .catch((error) => {
                    reject(error)
                  })
              })
              .catch((error) => {
                reject(error)
              })
          })
          .catch((error) => {
            reject(error)
          })
      })
    }

    async function handleUpload(event) {
      state.loading = true
      for (let file of event.target.files) {
        let fileresult = await uploadFile(file)
        state.selection = { dest: fileresult, rel: null }
        context.emit("change", props.name, state.selection, props.lang, props.index)
      }
      state.loading = false
    }

    async function handleDrop(event) {
      state.loading = true
      state.droparea = false
      for (let file of event.dataTransfer.files) {
        let fileresult = await uploadFile(file)
        state.selection = { dest: fileresult, rel: null }
        context.emit("change", props.name, state.selection, props.lang, props.index)
        break
      }
      state.loading = false
    }

    function openRelationalSelection() {
      state.openedSelection = true
    }

    function relationCloseAction(selection) {
      state.openedSelection = false
      if (selection) {
        state.selection = { dest: selection, rel: null }
        context.emit("change", props.name, state.selection, props.lang, props.index)
      }
    }

    function editSelection() {
      const mod = boneState.bonestructure["module"]
      const url = `/db/${mod}/edit/leaf/${props.value["dest"]["key"]}`
      let route = router.resolve(unref(url))
      dbStore.addOpened(route, mod)
    }

    function changeEventNested(val) {
      if (!state.selection) state.selection = {}
      if (Object.keys(state.selection).includes("rel") && state.selection["rel"]) {
        state.selection["rel"][val.name] = val.value
      } else {
        state.selection["rel"] = { [val.name]: val.value }
      }
      context.emit("change", props.name, state.selection, props.lang, props.index)
    }

    watch(
      () => props.value,
      (newVal, oldVal) => {
        state.selection = newVal
      }
    )

    return {
      state,
      Request,
      boneState,
      handlerState,
      downloadFile,
      createBackgroundImage,
      handleUpload,
      uploadinput,
      handleDrop,
      openRelationalSelection,
      relationCloseAction,
      editSelection,
      changeEventNested
    }
  }
})
</script>

<style scoped>
.box {
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  border: 1px solid var(--sl-color-gray-500);
  border-radius: 5px;
  min-height: 40px;
  max-height: 40px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;

  &:hover{
    .edit-btn{
      opacity: 1;
    }
   }
}

.preview {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  aspect-ratio: 1;
  border-right: 1px solid var(--sl-color-gray-500);
  margin-right: var(--sl-spacing-small);
  background-position: center;
  background-size: cover;

  & sl-icon {
    font-size: 1.1em;
    color: var(--sl-color-gray-400);
  }
}

.file-wrapper {
  width: 100%;
  display: flex;
  gap: var(--sl-spacing-x-small);
  position: relative;

  & + .nested_wrapper {
    padding-top: 0 !important;
  }
}

.droparea {
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 10;
  pointer-events: none;
  opacity: 0.9;
  border: 1px solid var(--sl-color-info-500);
  background-color: var(--sl-color-info-300);
  color: var(--sl-color-info-900);
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-btn {
  &::part(base) {
    aspect-ratio: 1;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
}

.nested_wrapper {
  padding-top: var(--sl-spacing-x-small);
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: var(--sl-spacing-small);
}

.edit-btn{
  margin-left: auto;
  opacity: 0;
  transition: all ease .3s;

  &::part(base) {
    border: none;
    aspect-ratio: 1;
    color: var(--sl-color-neutral-300);
    transition: all ease .3s;
   }

 &:hover{
  &::part(base) {
     border: none;
     color: var(--sl-color-neutral-800);
     background-color: transparent;
   }
  }
}
</style>
