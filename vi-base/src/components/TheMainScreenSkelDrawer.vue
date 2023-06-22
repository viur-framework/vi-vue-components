<template>
    <sl-drawer label="Details"
               :open="dbStore.state['skeldrawer.opened']"
               @sl-request-close.prevent="dbStore.state['skeldrawer.opened']=false"
    >
        <span v-if="Object.keys(dbStore.state['skeldrawer.entry']).length===0">{{ $t('skeldrawer.noentry') }}</span>

        <div v-for="(bone,boneName) in dbStore.state['skeldrawer.entry']">
            {{dbStore.state['skeldrawer.structure'][boneName]["descr"] }}: {{ getBoneViewer(dbStore.state['skeldrawer.entry'],boneName) }}
        </div>

    </sl-drawer>
</template>

<script lang="ts">
// @ts-nocheck
import {reactive, defineComponent} from 'vue'
import {useDBStore} from "../stores/db";
import {boneLogic} from '@viur/viur-vue-utils'

export default defineComponent({
    props: {},
    setup(props, context) {
        const state = reactive({})
        const dbStore = useDBStore()

        function getBoneViewer(skel, boneName){
          const {getBoneValue, bones_state} = boneLogic(skel, dbStore.state['skeldrawer.structure'])
          return getBoneValue(boneName, skel=skel)
        }

        return {
            state,
            dbStore,
            getBoneViewer
        }
    }
})
</script>

<style scoped lang="less">

</style>
