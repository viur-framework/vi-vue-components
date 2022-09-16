<template>
    <div class="home">
        Home
    </div>
</template>

<script lang="ts">
import {defineComponent, reactive} from 'vue'
import {useRoute} from "vue-router";

export default defineComponent({
    props: {},
    components: {},
    setup(props, context) {
        const route = useRoute()
        const state = reactive({})
        return {state, route}
    }
})
</script>

<style scoped lang="less">

</style>