<template>
  <div
    class="actionbar"
    @dragover.prevent="state.droparea = true"
    @dragleave="state.droparea = false"
    @drop.prevent="handleDrop"
  >
    <sl-button
      v-if="boneState.multiple && !readonly"
      variant="danger"
      :title="$t('bone.del')"
      outline
      class="delete-btn"
      @click="removeMultipleEntries(index, lang)"
    >
      <sl-icon
        slot="prefix"
        name="x-lg"
      ></sl-icon>
    </sl-button>

    <div
      v-if="state.droparea"
      class="droparea"
    >
      Dateien hier hinziehen
    </div>

    <input
      ref="uploadinput"
      hidden
      type="file"
      :multiple="boneState.multiple"
      @change="handleUpload"
    />
    <div class="upload-btn">
      <sl-button
        v-if="!boneState.readonly"
        @click="openSelector"
      >
        <sl-icon
          slot="prefix"
          name="list-ul"
        ></sl-icon>
      </sl-button>

      <sl-button
        v-if="boneState.multiple && !readonly"
        variant="success"
        outline
        :title="$t('bone.upload')"
        @click="uploadinput.click()"
        :loading="state.loading"
      >
        <sl-icon
          slot="prefix"
          name="upload"
        ></sl-icon>
        {{ $t("bone.upload") }}
        <sl-spinner
          v-if="state.loading"
          slot="suffix"
        ></sl-spinner>
      </sl-button>
    </div>
  </div>

  <relational-selector
    :open="state.openedSelection"
    :name="boneState.bonestructure['descr']"
    :tab-id="handlerState.tabId"
    :handler="state.moduleInfo['handlerComponent']"
    :module="boneState?.bonestructure['module']"
    :rowselect="2"
    @close="relationCloseAction"
  >
  </relational-selector>
</template>

<script setup>
import { reactive, defineComponent, onMounted, inject, ref, resolveComponent, computed } from "vue"
import { Request } from "@viur/vue-utils"
import relationalSelector from "../components/relationalSelector.vue"
import { useDBStore } from "../../stores/db"

  const props = defineProps({
    name: String,
    value: Object,
    index: Number,
    lang: String,
    readonly: Boolean,
    params: Object
  })

  const emit = defineEmits(["change"])

    const boneState = inject("boneState")
    const handlerState = inject("handlerState")
    const addMultipleEntry = inject("addMultipleEntry")
    const removeMultipleEntries = inject("removeMultipleEntries")
    const dbStore = useDBStore()
    const formatString = inject("formatString")
    const uploadinput = ref()
    const state = reactive({
      skels: {},
      uploadinput: null,
      loading: false,
      droparea: false,
      moduleInfo: computed(() => dbStore.getConf(boneState?.bonestructure["module"])),
      hasUsing: computed(() => boneState?.bonestructure["using"]),
      openedSelection: false
    })

    function uploadFile(file) {
      const filedata = {
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
                const addData = {
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
        // uploadinput.value.value = null
        let relDefault = null
        if (state.hasUsing) {
          relDefault = undefined
        }

        addMultipleEntry(props.lang, { dest: fileresult, rel: relDefault })
      }
      state.loading = false
    }

    async function handleDrop(event) {
      state.loading = true
      state.droparea = false
      for (let file of event.dataTransfer.files) {
        let fileresult = await uploadFile(file)
        let relDefault = null
        if (state.hasUsing) {
          relDefault = undefined
        }
        addMultipleEntry(props.lang, { dest: fileresult, rel: relDefault })
      }
      state.loading = false
    }

    function openSelector() {
      state.openedSelection = true
    }

    function relationCloseAction(selection) {
      state.openedSelection = false
      if (selection) {
        for (let entry of selection) {
          let relDefault = null
          if (state.hasUsing) {
            relDefault = undefined
          }
          addMultipleEntry(props.lang, { dest: entry, rel: relDefault })
        }
      }
    }

    onMounted(() => {
      if (!props.value || props.value.length === 0) {
        emit("change", props.name, [], props.lang) //init
      }
    })
</script>

<style scoped>
.actionbar {
  display: flex;
  position: relative;
  flex-wrap: nowrap;
}
sl-combobox {
  width: 100%;
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

.add-btn {
  margin-left: var(--sl-spacing-x-small);
}

.upload-btn {
  margin-left: auto;
  gap: var(--sl-spacing-x-small);
  display: flex;
}
</style>
