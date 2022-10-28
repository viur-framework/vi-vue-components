<template>
    <router-link :to="state.url" custom v-slot="{route}">
        <sl-button variant="success" @click="createAndNavigate(route)">
            <sl-icon slot="prefix" name="plus"></sl-icon>
            {{ $t("actions.add") }}
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
            url: computed(() => {
                return `/${route.params.module}/add?_=${new Date().getTime()}`
            })

        })

        function createAndNavigate(route: any) {
            appStore.addOpened(route, handlerState["module"], handlerState["view"])
        }

        return {
            state,
            createAndNavigate
        }
    }
})
</script>

<style scoped lang="less">

</style>