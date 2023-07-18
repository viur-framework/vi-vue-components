<template>
    <sl-button  size="small" variant="success" @click="openAction($event)" :disabled="!state.canAdd"
                :title="$t('actions.addfolder')">
        <sl-icon slot="prefix" name="folder-plus"></sl-icon>
       {{ $t("actions.addfolder") }}
    </sl-button>

    <sl-dialog v-if="state.opened"
               :open="state.opened"
               :label="$t('actions.addfolder')"
               @sl-request-close="closeAction($event)"
               >
        <sl-input autofocus placeholder="name" v-model="state.foldername"></sl-input>
      {{state.foldername}}
        <sl-button slot="footer" variant="success" :loading="state.loading" @click="createNode($event)">{{$t('create')}}</sl-button>
        <sl-button slot="footer" variant="danger" outline @click="closeAction($event)">{{$t('abort')}}</sl-button>
    </sl-dialog>
</template>

<script lang="ts">
// @ts-nocheck
import {reactive, defineComponent, inject, computed} from 'vue'
import {useDBStore} from "../stores/db";
import {useUserStore} from "../stores/user";
import {useRoute} from "vue-router";
import {Request} from "@viur/vue-utils";

export default defineComponent({
    props: {},
    components: {},
    setup(props, context) {
        const handlerState: any = inject("handlerState")
        const tableReload: any = inject("reloadAction")
        const dbStore = useDBStore();
        const userStore = useUserStore();
        const route = useRoute();

        const state = reactive({
          canAdd: computed(() => {
            if(userStore.state.user.access.indexOf("root") !== -1 )
            {
              return true;
            }
            return userStore.state.user.access.indexOf(`${handlerState.module}-add`)>-1;
          }),
          opened:false,
          foldername:"",
          loading:false
        })

        function closeAction(e){
          state.opened=false
        }
        function openAction(e){
          state.opened=true
        }
        function createNode(e){
          state.loading=true
          Request.add(handlerState.module,{dataObj:{
            "name":state.foldername,
            "skelType":"node",
            "node":handlerState.currentSelection?handlerState.currentSelection[0]['key']: handlerState.currentRootNode['key']
          }}).then(()=>{
            state.opened=false
            state.loading=false
            tableReload()
          })
        }

        return {
            state,
            openAction,
            closeAction,
            createNode
        }
    }
})
</script>

<style scoped>

</style>
