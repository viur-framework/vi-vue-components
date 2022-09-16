<template>
    <sl-drawer label="Details"
               :open="appStore.state['skeldrawer.opened']"
               @sl-request-close="appStore.state['skeldrawer.opened']=false"
    >
        <span v-if="Object.keys(appStore.state['skeldrawer.entry']).length===0">{{ $t('skeldrawer.noentry') }}</span>

        <div v-for="(bone,boneName) in appStore.state['skeldrawer.entry']">
            {{ boneName }}:
            <component
                :is="getWidget(boneName)"
                :boneName="boneName"
                :skel="appStore.state['skeldrawer.entry']"
                :structure="appStore.state['skeldrawer.structure']"
            ></component>
        </div>

    </sl-drawer>
</template>

<script lang="ts">
import {reactive, defineComponent} from 'vue'
import {useAppStore} from "../stores/app";
import bones from './Bones/view/index'

export default defineComponent({
    props: {},
    components: {...bones},
    setup(props, context) {
        const state = reactive({})
        const appStore = useAppStore()

        function getWidget(boneName: string) {
            let widget = "base_item"
            // @ts-ignore
            if (appStore.state["skeldrawer.structure"]?.[boneName]["type"]) {
                // @ts-ignore
                const typeName = appStore.state["skeldrawer.structure"][boneName]["type"].replace(/\./g, "_")
                if (Object.keys(bones).includes(typeName)) {
                    widget = typeName
                }
            }
            return widget
        }

        return {
            state,
            appStore,
            getWidget
        }
    }
})
</script>

<style scoped lang="less">

</style>