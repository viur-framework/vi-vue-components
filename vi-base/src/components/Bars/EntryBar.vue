<template>
    <div class="bar" style="z-index: 50">
        <save></save>
        <save
            name="action.save_close"
            icon="check-all"
            :close="true"
        ></save>
    </div>
</template>

<script lang="ts">
import {reactive, defineComponent} from 'vue'
import Save from "../Actions/save.vue";

export default defineComponent({
    props: {},
    components: {Save},
    setup(props, context) {
        const state = reactive({})
        return {state}
    }
})
</script>

<style scoped lang="less">

</style>