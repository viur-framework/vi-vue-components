<template>
  <div
    class="file-wrapper"
    @dragover.prevent="state.droparea = true"
    @dragleave="state.droparea = false"
    @drop.prevent="handleDrop"
  >
    <div class="droparea" v-if="state.droparea">Dateien hier hinziehen</div>
    <sl-button
      v-if="!boneState.readonly && (!value || state.loading)"
      @click="uploadinput.click()"
      :title="$t('bone.upload')"
      outline
      class="upload-btn"
    >
      <sl-icon name="upload"></sl-icon>
      <sl-spinner slot="suffix" v-if="state.loading"></sl-spinner>
    </sl-button>
    <sl-button @click="openRelationalSelection" v-if="!boneState.readonly && (!value || state.loading)">
      <sl-icon name="menu"></sl-icon>
    </sl-button>
    <input
      hidden
      type="file"
      ref="uploadinput"
      :multiple="boneState.multiple"
      @change="handleUpload"
    />
    <sl-button @click="downloadFile" v-if="value">
      <sl-icon name="download" slot="prefix"></sl-icon>
    </sl-button>
    <div class="box" v-if="!boneState.isEmpty">
      <div class="preview" v-if="value?.['dest']?.['mimetype'].includes('image')">
      <vi-image :src="Request.downloadUrlFor(value)" popup>
      </vi-image>
      </div>

      <div class="preview" v-else>
        <sl-icon v-if="value?.['dest']?.['name']" name="file-earmark"></sl-icon>
      </div>
      <div v-if="value?.['dest']?.['name']">
        {{ decodeURIComponent(value?.["dest"]?.["name"]) }}
      </div>
    </div>
    <sl-button @click="editSelection" variant="info" outline v-if="value">
        <sl-icon name="pencil"></sl-icon>
      </sl-button>
    <sl-button
      v-if="!boneState.multiple && !boneState.isEmpty"
      variant="danger"
      outline
      @click="$emit('change', name, '', lang, index)"
      :title="$t('bone.del')"
      class="delete-btn"
    >
      <sl-icon name="x"></sl-icon>
    </sl-button>
  </div>
  <div class="nested_wrapper">
    <Wrapper_nested v-if="boneState?.bonestructure['using']"
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
import { reactive, defineComponent, onMounted, inject, ref, computed, unref, watch } from "vue";
import { useRouter } from "vue-router";
import { Request } from "@viur/vue-utils";
import relationalSelector from './components/relationalSelector.vue'
import Wrapper_nested from '@viur/vue-utils/bones/edit/wrapper_nested.vue'
import { useDBStore } from '../stores/db'
import ViImage from "@viur/vue-utils/generic/Image.vue";

export default defineComponent({
  props: {
    name: String,
    value: Object,
    index: Number,
    lang: String,
  },
  components: {relationalSelector,Wrapper_nested,ViImage},
  emits: ["change"],
  setup(props, context) {
    const boneState = inject("boneState");
    const handlerState = inject("handlerState")
    const router = useRouter()
    const uploadinput = ref();
    const dbStore = useDBStore()
    const state = reactive({
      loading: false,
      droparea: false,
      openedSelection:false,
      moduleInfo:computed(()=>dbStore.getConf(boneState?.bonestructure['module'])),
      selection:null
    });

    onMounted(() => {
      state.selection=props.value
      context.emit("change", props.name, props.value, props.lang, props.index); //init
    });

    function downloadFile() {
      console.log(Request.downloadUrlFor(props.value))
      window.open(Request.downloadUrlFor(props.value));
    }

    function createBackgroundImage(){
      return Request.downloadUrlFor(props.value, false)
    }

    function uploadFile(file) {
      const filedata: Record<string, string> = {
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size.toString(),
      };
      return new Promise((resolve, reject) => {
        Request.securePost("/vi/file/getUploadURL", { dataObj: filedata })
          .then(async (resp) => {
            let uploadURLdata = await resp.json();
            fetch(uploadURLdata["values"]["uploadUrl"], {
              body:file,
              method: "POST",
              mode: "no-cors",
            })
              .then(async (uploadresp) => {
                const addData: Record<string, string> = {
                  key: uploadURLdata["values"]["uploadKey"],
                  node: undefined,
                  skelType: "leaf",
                };
                Request.securePost("/vi/file/add", { dataObj: addData })
                  .then(async (addresp) => {
                    let addData = await addresp.json();
                    if (addData["action"] === "addSuccess") {
                      resolve(addData["values"]);
                    } else {
                      reject(addData);
                    }
                  })
                  .catch((error) => {
                    reject(error);
                  });
              })
              .catch((error) => {
                reject(error);
              });
          })
          .catch((error) => {
            reject(error);
          });
      });
    }

    async function handleUpload(event) {
      state.loading = true;
      for (let file of event.target.files) {
        let fileresult = await uploadFile(file);
        state.selection = { dest: fileresult, rel: null }
        context.emit(
          "change",
          props.name,
          state.selection,
          props.lang,
          props.index
        );
      }
      state.loading = false;
    }

    async function handleDrop(event) {
      state.loading = true;
      state.droparea = false;
      for (let file of event.dataTransfer.files) {
        let fileresult = await uploadFile(file);
         state.selection = { dest: fileresult, rel: null }
        context.emit(
          "change",
          props.name,
          state.selection,
          props.lang,
          props.index
        );
        break;
      }
      state.loading = false;
    }

    function openRelationalSelection(){
      state.openedSelection=true
    }

    function relationCloseAction(selection){
      state.openedSelection=false
      if(selection){
        state.selection = selection
        context.emit("change",props.name,selection,props.lang,props.index)
      }

    }

    function editSelection(){
      const mod = boneState.bonestructure["module"]
      const url = `/db/${mod}/edit/leaf/${props.value['dest']['key']}`;
      let route = router.resolve(unref(url))
      dbStore.addOpened(route, mod);
    }

    function changeEventNested(val){
      if (Object.keys(state.selection).includes('rel')){
        state.selection["rel"][val.name] = val.value
      }else{
        state.selection["rel"] = {[val.name]:val.value}
      }
      context.emit("change",props.name,state.selection,props.lang,props.index)
    }

    watch(()=>props.value,(newVal,oldVal)=>{
      state.selection=newVal
    })

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
    };
  },
});
</script>

<style scoped>
.box {
  display: flex;
  align-items: center;
  padding: 0 var(--sl-spacing-small) 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  border: 1px solid var(--sl-color-gray-500);
  border-radius: 5px;
  min-height: 40px;
  max-height: 40px;
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
  gap: 10px;
  position: relative;
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

.delete-btn {
  &::part(base) {
    aspect-ratio: 1;
  }
}

.upload-btn {
  &::part(base) {
    aspect-ratio: 1;
  }
}

.nested_wrapper{
  padding-top: 5px;
}
</style>
