<template>
    <sl-button>
        <sl-icon slot="prefix" name="list-ul"></sl-icon>
        {{ $t("actions.selectfields") }}
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