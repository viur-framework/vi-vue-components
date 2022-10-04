<template>
  <sl-select value="30" :label='$t("actions.setamount")' @sl-change="amoutChange">
    <sl-menu-item value="30">30</sl-menu-item>
    <sl-menu-item value="60">60</sl-menu-item>
    <sl-menu-item value="99">99</sl-menu-item>
  </sl-select>

</template>

<script lang="ts">
import {reactive, defineComponent, inject} from 'vue'

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const state = reactive({});

    const setLimit: any = inject("setLimit")
    function amoutChange(e: Event) {
     setLimit(e.target.value);
    }

    return {state, amoutChange}
  }
})
</script>

<style scoped lang="less">

</style>
