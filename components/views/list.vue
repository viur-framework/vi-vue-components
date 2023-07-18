<template>
    <list-handler
        :module="module"
        :group="group"
        :view="state.view"
    >

    </list-handler>
</template>

<script lang="ts">
import {reactive, defineComponent, computed} from 'vue'
import {useRoute, onBeforeRouteUpdate} from "vue-router";
import ListHandler from "../handler/ListHandler.vue";
import {useUserStore} from "../stores/user";

export default defineComponent({
    props: {
        module: {
            type: String,
            required: true
        },
        group: String
    },
    components: {ListHandler},
    setup(props, context) {
        const route = useRoute()
        const userstore = useUserStore()

        const state = reactive({
            view: computed(() => {
                if (Object.keys(route.query).includes("view")) {
                    return route.query["view"]
                }
                return null
            })
        })

        onBeforeRouteUpdate(async (to,from)=>{
          userstore.updateUser()
        })

        return {
            state
        }
    }
})
</script>

<style scoped >

</style>
