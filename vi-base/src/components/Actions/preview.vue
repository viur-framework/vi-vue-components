<template>
    <sl-button :disabled="!state.active"
               size="small"
               :title="$t('actions.preview')"
    >
        <sl-icon slot="prefix" name="eye"></sl-icon>
    </sl-button>
</template>

<script lang="ts">
import {reactive, defineComponent, inject, computed} from 'vue'

export default defineComponent({
    props: {},
    components: {},
    setup(props, context) {
        const handlerState: any = inject("state")
        const state = reactive({
            active: computed(() => {
                return handlerState.currentSelection && handlerState.currentSelection.length > 0
            })
        })
        return {state}
    }
})
</script>

<style scoped lang="less">

</style>
