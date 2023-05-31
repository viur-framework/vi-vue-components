<template>
  <sl-switch @sl-change="changeeditState" size="small"
             :title="$t('actions.edittable')">
    <span>{{ $t("actions.edittable") }}</span>
  </sl-switch>
</template>

<script lang="ts">
import {reactive, defineComponent, inject, computed} from 'vue'
import {useRoute} from "vue-router";
import {useDBStore} from "../../stores/db";

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const handlerState: any = inject("state")
    const dbStore = useDBStore()


    function changeeditState(event: any) {
      console.log(event.target.checked)
      handlerState.editableTable = event.target.checked

    }

    return {

      changeeditState
    }
  }
})
</script>

<style scoped lang="less">

span{
  font-size: .9em;
}

</style>
