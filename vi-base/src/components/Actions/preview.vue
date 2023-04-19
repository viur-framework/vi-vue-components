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
//@ts-ignore
import {reactive, defineComponent, inject, computed} from 'vue'
import {useAppStore} from "../../stores/app";

export default defineComponent({
    props: {},
    components: {},
    setup(props, context) {
        const handlerState: any = inject("state")
        const appStore = useAppStore();
        const state = reactive({
            active: computed(() => {
                return handlerState.currentSelection && handlerState.currentSelection.length > 0
            })
        })

        function openPreview(){
          let conf = appStore.state["vi.modules"][handlerState["module"]]
          if (Object.keys(conf).includes("previewurls")){
            for (const [k, v] of Object.entries(conf['previewurls'])) {
              for(let selection of handlerState.currentSelection){
                console.log("XXXX")
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
