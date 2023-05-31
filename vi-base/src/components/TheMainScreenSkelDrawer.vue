<template>
    <sl-drawer label="Details"
               :open="dbStore.state['skeldrawer.opened']"
               @sl-request-close="dbStore.state['skeldrawer.opened']=false"
    >
        <span v-if="Object.keys(dbStore.state['skeldrawer.entry']).length===0">{{ $t('skeldrawer.noentry') }}</span>

        <div v-for="(bone,boneName) in dbStore.state['skeldrawer.entry']">
            {{ boneName }}:
            <component
                :is="getWidget(boneName)"
                :boneName="boneName"
                :skel="dbStore.state['skeldrawer.entry']"
                :structure="dbStore.state['skeldrawer.structure']"
            ></component>
        </div>

    </sl-drawer>
</template>

<script lang="ts">
// @ts-nocheck
import {reactive, defineComponent} from 'vue'
import {useDBStore} from "../stores/db";

export default defineComponent({
    props: {},
    setup(props, context) {
        const state = reactive({})
        const dbStore = useDBStore()

        function getWidget(boneName: string) {
            let widget = "base_item"
            // @ts-ignore
            if (dbStore.state["skeldrawer.structure"]?.[boneName]["type"]) {
                // @ts-ignore
                const typeName = dbStore.state["skeldrawer.structure"][boneName]["type"].replace(/\./g, "_")
                if (Object.keys({}).includes(typeName)) {
                    widget = typeName
                }
            }
            return widget
        }

        return {
            state,
            dbStore,
            getWidget
        }
    }
})
</script>

<style scoped lang="less">

</style>
