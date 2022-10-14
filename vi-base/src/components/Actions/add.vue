<template>
    <router-link :to="state.url" custom v-slot="{navigate}">
        <sl-button variant="success" @click="createAndNavigate(navigate)" size="small">
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

        function createAndNavigate(navigate: any) {
            appStore.addOpened(state.url, handlerState["module"], handlerState["view"])
            navigate()
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
