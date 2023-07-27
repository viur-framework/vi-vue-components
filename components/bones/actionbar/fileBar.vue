<template>

  <div class="actionbar" @dragover.prevent="state.droparea=true" @dragleave="state.droparea=false" @drop.prevent="handleDrop">

      <sl-button variant="danger"
                 v-if="boneState.multiple && !readonly"
                 @click="removeMultipleEntries(index,lang)"
                :title='$t("bone.del")'
                 outline
                 class="delete-btn"
      >
         <sl-icon name="x"></sl-icon>
      </sl-button>

      <div class="droparea" v-if="state.droparea">Dateien hier hinziehen</div>

      <input hidden type="file" ref="uploadinput" :multiple="boneState.multiple" @change="handleUpload"/>
      <!--
      <sl-button v-if="boneState.multiple && !readonly"
                 @click="openSelector(lang)"
                 outline
                 :title='$t("bone.list")'
                 class="add-btn"
      >
          <sl-icon name="plus"></sl-icon>
      </sl-button>
      -->


      <sl-button variant="success"
                 v-if="boneState.multiple && !readonly"
                 @click="uploadinput.click()"
                 outline
                 :title='$t("bone.upload")'
                 class="upload-btn"
      >
        <sl-icon name="upload"></sl-icon>
        {{ $t("bone.upload") }}
        <sl-spinner slot="suffix" v-if="state.loading"></sl-spinner>
      </sl-button>
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

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, onMounted, inject,ref, resolveComponent, computed} from 'vue'
import { Request } from "@viur/vue-utils"
import relationalSelector from '../components/relationalSelector.vue'
import { useDBStore } from '../../stores/db'

export default defineComponent({
  props:{
      name:String,
      value:Object,
      index:Number,
      lang:String,
      readonly:Boolean,
      params:Object,
  },
  components: {relationalSelector},
  emits:["change"],
  setup(props, context) {
      const boneState = inject("boneState")
      const handlerState = inject("handlerState")
      const addMultipleEntry = inject("addMultipleEntry")
      const removeMultipleEntries = inject("removeMultipleEntries")
      const dbStore = useDBStore()
      const formatString = inject("formatString")
      const uploadinput = ref()
      const state = reactive({
        skels:{},
        uploadinput:null,
        loading:false,
        droparea:false,
        moduleInfo:computed(()=>dbStore.getConf(boneState?.bonestructure['module'])),
      })

      function uploadFile(file){
        const filedata: Record<string, string> = {
          "fileName": file.name,
          "mimeType": file.type || "application/octet-stream",
          "size": file.size.toString(),
        }
        return new Promise((resolve,reject)=>{
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
        })
      }

      async function handleUpload(event){
        state.loading = true
        for (let file of event.target.files){
          let fileresult = await uploadFile(file)
          console.group(fileresult)
          addMultipleEntry(props.lang, {'dest':fileresult,'rel':null})
        }
        state.loading = false

      }

      async function handleDrop(event){
        state.loading = true
        state.droparea=false
        for (let file of event.dataTransfer.files){
          let fileresult = await uploadFile(file)
          console.group(fileresult)
          addMultipleEntry(props.lang, {'dest':fileresult,'rel':null})
        }
        state.loading = false
      }

      function openSelector(lang){
        state.openedSelection=true
      }

      function relationCloseAction(selection){
        state.openedSelection=false
        if(selection){
          for(let entry of selection){
            addMultipleEntry(props.lang, {'dest':entry,'rel':null})
          }
        }
      }


      return {
          state,
          boneState,
          handlerState,
          addMultipleEntry,
          removeMultipleEntries,
          uploadFile,
          uploadinput,
          handleUpload,
          handleDrop,
          openSelector,
          relationCloseAction
      }
  }
})
</script>

<style scoped>
.actionbar{
  display: flex;
  position: relative;
  flex-wrap: nowrap;

}
sl-combobox{
  width:100%
}

.droparea{
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 10;
  pointer-events: none;
  opacity: 0.9;
  border: 1px solid var(--sl-color-info-500);
  background-color: var(--sl-color-info-300);
  color:var(--sl-color-info-900);
  display: flex;
  align-items: center;
  justify-content: center;

}

.delete-btn{
  &::part(base){
    aspect-ratio: 1;
  }
}

.add-btn{
  margin-left: var(--sl-spacing-x-small);

  &::part(base){
    aspect-ratio: 1;
  }
}

.upload-btn{
  margin-left: auto;

  & sl-icon{
    margin-right: var(--sl-spacing-x-small);
  }
}
</style>
