<template>
    <sl-tab slot="nav"
            :closable="closeable"
            :key="to"
            @sl-close="onTabClose"
    >
        <router-link :to="to">
            <sl-icon v-if="state.icon"
                     @sl-error="onIconError"
                     :library="library"
                     :name="icon"
                     sprite></sl-icon>
            <slot></slot>
        </router-link>
    </sl-tab>
</template>

<script lang="ts">
import {reactive, defineComponent} from 'vue'
import {useAppStore} from "../stores/app";
import {useRouter} from "vue-router";

export default defineComponent({
    props: {
        to: {
            type: Object,
            required: true,
            default: undefined
        },
        name: {
            type: String,
            default: undefined
        },
        icon: {
            type: String,
            default: undefined
        },
        library: {
            type: String,
            default: "default"
        },
        closeable: {
            type: Boolean,
            default: true
        }
    },
    components: {},
    setup(props, context) {
        const appStore = useAppStore()
        const router = useRouter()
        const state = reactive({
            icon:true
        })
        function onIconError(){
            state.icon=false
        }

        function onTabClose(){
            // @ts-ignore
            router.push({"name": "home"}).then(()=>{
                appStore.removeOpened(props.to)
            })
        }

        return {
            state,
            onIconError,
            onTabClose
        }
    }
})
</script>

<style scoped lang="less">
sl-icon{
    margin-right:5px
}
</style>