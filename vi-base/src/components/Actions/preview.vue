<template>
    <sl-button :disabled="!state.active"
               size="small"
               :title="$t('actions.preview')"
               @click="openPreview"
    >
        <sl-icon slot="prefix" name="eye"></sl-icon>
    </sl-button>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, inject, computed} from 'vue'
import {useAppStore} from "../../stores/app";
import {useRoute} from "vue-router";

export default defineComponent({
    props: {},
    components: {},
    setup(props, context) {
        const handlerState: any = inject("state")
        const appStore = useAppStore();
        const route = useRoute();
        const state = reactive({
            active: computed(() => {
                return handlerState.currentSelection && handlerState.currentSelection.length > 0
            })
        })

        function openPreview(){
          let module = handlerState["module"]
          if(Object.keys(route.params).includes("parentmodule")){
            module = route.params['parentmodule']
          }

          let conf = appStore.state["vi.modules"][module]
          if (Object.keys(conf).includes("previewurls")){
            for (const [k, v] of Object.entries(conf['previewurls'])) {
              for(let selection of handlerState.currentSelection){
                window.open(import.meta.env.VITE_API_URL+v.replace("{{key}}",selection["key"]), '_blank').focus();
              }
            }
          }
        }

        return {
          state,
          openPreview

        }
    }
})
</script>

<style scoped lang="less">

</style>
