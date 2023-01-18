<template>
    <form-handler
        :module="module"
        :group="group"
        :action="route.meta['action']"
        :skelkey="skelkey"
    >
    </form-handler>

</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, onDeactivated, watch, getCurrentInstance} from 'vue'
import FormHandler from "../components/DataHandler/FormHandler.vue";
import {useRoute} from "vue-router";
import {useAppStore} from "../stores/app";
import utils from "../utils"

export default defineComponent({
    props: {
        module: {
            type: String,
            required: true
        },
        group: String,
        skelkey: String
    },
    components: {FormHandler},
    setup(props, context) {
        const state = reactive({})
        const appStore = useAppStore()
        const route = useRoute()

        watch(() => appStore.state["vi.modules"], (newVal, oldVal) => { //wait till modules loaded
            if (!utils.objectEmpty(newVal) && appStore.state["handlers.opened"].filter(e=>e["url"]===route.fullPath).length<=0) {
                appStore.addOpened(route.fullPath, props.module, route.query?.["view"])
            }
        })

        return {
            state,
            route
        }
    }
})
</script>

<style scoped lang="less">

</style>