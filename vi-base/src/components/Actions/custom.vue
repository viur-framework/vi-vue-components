<template>
    <sl-button size="small">
        <sl-icon slot="prefix" name="error"></sl-icon>
        custom
    </sl-button>
</template>

<script lang="ts">
import {reactive, defineComponent} from 'vue'

export default defineComponent({
    props: {},
    components: {},
    setup(props, context) {
        const state = reactive({})
        return {state}
    }
})
</script>

<style scoped lang="less">

</style>
