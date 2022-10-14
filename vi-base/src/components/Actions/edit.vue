<template>
    <router-link :to="state.url" custom v-slot="{navigate}">
        <sl-button variant="info" size="small" :disabled="!state.active" @click="createAndNavigate(navigate)">
            <sl-icon slot="prefix" name="pencil"></sl-icon>
            {{ $t("actions.edit") }}
        </sl-button>
    </router-link>
</template>

<script lang="ts">
import {reactive, defineComponent, inject, computed} from 'vue'
import {useRoute} from "vue-router";
import {useAppStore} from "../../stores/app";

export default defineComponent({
    props: {},
    components: {},
    setup(props, context) {
        const handlerState: any = inject("state")
        const appStore = useAppStore()
        const route = useRoute()
        const state = reactive({
            active: computed(() => {
                return handlerState.currentSelection && handlerState.currentSelection.length > 0
            }),
            url: computed(() => {
                if (!state.active) return ""
                return `/${route.params.module}/edit/${handlerState.currentSelection[0]["key"]}?_=${new Date().getTime()}`
            })
        })

        function createAndNavigate(navigate: any) {
            appStore.addOpened(state.url, handlerState["module"], handlerState["view"])
            navigate()
        }

        return {
            state,
            handlerState,
            createAndNavigate
        }
    }
})
</script>

<style scoped lang="less">

</style>
