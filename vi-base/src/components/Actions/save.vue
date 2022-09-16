<template>
    <sl-button variant="success" @click="save">
        <sl-icon slot="prefix" :name="icon"></sl-icon>
        {{ $t(name) }}
    </sl-button>
</template>

<script lang="ts">
import {reactive, defineComponent, inject, computed} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {useAppStore} from "../../stores/app";

export default defineComponent({
    props: {
        close: {
            type: Boolean,
            default: false
        },
        name: {
            type: String,
            default: "actions.save"
        },
        icon: {
            type: String,
            default: "check"
        }
    },
    components: {},
    setup(props, context) {
        const handlerState: any = inject("state")
        const router = useRouter()
        const route = useRoute()
        const appStore = useAppStore()
        const state = reactive({})

        function save() {
            //Send request
            console.log(handlerState.formValues)
            if (props.close) {
                appStore.removeOpened(route.fullPath)
                router.push({"name": "home"})
            }


        }

        return {
            state,
            save,
            handlerState
        }
    }
})
</script>

<style scoped lang="less">

</style>