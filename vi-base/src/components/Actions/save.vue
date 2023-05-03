<template>
  <sl-button variant="success" size="small" @click="save" :loading="state.loading" title="$t(name)">
    <sl-icon slot="prefix" :name="icon"></sl-icon>
    {{ $t(name) }}
  </sl-button>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, inject, computed} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {useAppStore} from "../../stores/app";
import {Request} from "@viur/viur-vue-utils";
import {useMessageStore} from "../../stores/message";
export default defineComponent({
  props: {
    close: {
      type: Boolean,
      default: false
    },
    name: {
      type: String,
      default: "actions.save"
    },
    icon: {
      type: String,
      default: "check"
    }

  },
  components: {},
  setup(props, context) {
    const handlerState: any = inject("state");
    const router = useRouter();
    const route = useRoute();
    const appStore = useAppStore();
    const state = reactive({
      loading:false
    });
    const messageStore = useMessageStore();

    function save() {
      state.loading=true
      //Send request
      const formData: FormData = new FormData();
      for (const [boneName, boneValue] of Object.entries(handlerState.formValues)) {
        for (const value of boneValue) {
          for (const [k, v] of Object.entries(value)) {

            formData.append(k, v)
          }
        }
      }
      const obj = {}
      for (const key: string of formData.keys()) {
        obj[[key]] = formData.getAll(key);

      }
      let url = `/vi/${handlerState.module}/${handlerState.action==="clone"?"add":handlerState.action}`;

      if(handlerState.skeltype==="node" && handlerState.action=="add")
      {
        obj["skelType"]="node";
        obj["node"]=handlerState.skelkey;

      }
      if (handlerState.action === "edit") {
        url += `/${handlerState.skelkey}`
      }


      Request.securePost(url, {dataObj: obj}).then(async (resp: Response) => {
        let responsedata = await resp.json()
        handlerState.errors = [];
        if (handlerState.action === "edit") {
          if (responsedata["action"] === "edit") {//Something went wrong we must thorw (show) errors
            handlerState.errors = responsedata["errors"];
          } else {
            messageStore.addMessage("success", `Edit`, "Entry edited successfully");
            state.loading=false
            appStore.markHandlersToUpdate(handlerState.module,handlerState.group)
            if (props.close) {
              appStore.removeOpened(route);
            }
          }
        }
        if (handlerState.action === "add"|| handlerState.action === "clone") {
          if (responsedata["action"] === "add") {//Something went wrong we must thorw (show) errors
            handlerState.errors = responsedata["errors"];
          } else {
            messageStore.addMessage("success", `Add`, "Added edited successfully");
            state.loading=false
            appStore.markHandlersToUpdate(handlerState.module,handlerState.group)
            if (props.close) {
              appStore.removeOpened(route);
            }
          }
        }
      }).catch((error)=>{
        console.log(error)
        messageStore.addMessage("error", `Error on Save`, "Error on Save");
      })
    }

    return {
      state,
      save,
      handlerState,
      route
    }
  }
})
</script>

<style scoped lang="less">

</style>
