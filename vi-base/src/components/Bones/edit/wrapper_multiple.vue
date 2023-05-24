<template>
    <div class="value-line">
      <slot></slot>
      <sl-button variant="danger" outline @click="$emit('delete')">{{ $t("bone.del") }}</sl-button>
    </div>
</template>

<script lang="ts">
import {reactive, defineComponent} from 'vue'

export default defineComponent({
    props: {},
    components: {},
    emits:['change','delete'],
    setup(props, context) {
        const state = reactive({})
        return {state}
    }
})
</script>

<style scoped lang="less">
.value-line{
    display:flex;
    gap:10px;
    & slot{
        width:100%;
    }
}
</style>
