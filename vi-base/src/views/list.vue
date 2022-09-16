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
import {useRoute} from "vue-router";
import ListHandler from "../components/DataHandler/ListHandler.vue";

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

        const state = reactive({
            view: computed(() => {
                if (Object.keys(route.query).includes("view")) {
                    return route.query["view"]
                }
                return null
            })
        })

        return {
            state
        }
    }
})
</script>

<style scoped lang="less">

</style>