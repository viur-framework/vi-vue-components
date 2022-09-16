<template>
    <sl-button size="small" variant="default"  class="btn--mobile-simple">
        <sl-icon name="clock" slot="prefix" sprite></sl-icon>
        Testactions
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