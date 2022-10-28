<template>
    <sl-button @click="openDrawer" :disabled="!state.active">
        <sl-icon slot="prefix" name="file-earmark-pdf"></sl-icon>
        {{ $t("actions.overlay") }}
    </sl-button>
</template>

<script lang="ts">
import {reactive, defineComponent, inject, computed} from 'vue'
import {useAppStore} from "../../stores/app";

export default defineComponent({
    props: {},
    components: {},
    setup(props, context) {
        const handlerState: any = inject("state")
        const appStore = useAppStore()
        const state = reactive({
            active: computed(() => {
                return handlerState.currentSelection && handlerState.currentSelection.length > 0
            })
        })

        function openDrawer() {
            appStore.state["skeldrawer.opened"] = !appStore.state["skeldrawer.opened"]
        }

        return {
            state,
            handlerState,
            openDrawer
        }
    }
})
</script>

<style scoped lang="less">

</style>