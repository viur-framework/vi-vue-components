<template>
    <fluidpage-handler
        :module="module"
        :group="group"
        :view="state.view"
    >

    </fluidpage-handler>
</template>

<script lang="ts">
import {reactive, defineComponent, computed} from 'vue'
import {onBeforeRouteUpdate, useRoute} from "vue-router";
import FluidpageHandler from "../handler/FluidpageHandler.vue";
import {useUserStore} from "../stores/user";

export default defineComponent({
    props: {
        module: {
            type: String,
            required: true
        },
        group: String
    },
    components: {FluidpageHandler},
    setup(props, context) {
        const route = useRoute()
        const userStore = useUserStore()

        const state = reactive({
            view: computed(() => {
                if (Object.keys(route.query).includes("view")) {
                    return route.query["view"]
                }
                return null
            })
        })

        onBeforeRouteUpdate(async (to,from)=>{
          userStore.updateUser()
        })

        return {
            state
        }
    }
})
</script>

<style scoped>

</style>
