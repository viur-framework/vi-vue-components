<template>
  <sl-button size="small" @click="handleClick" :loading="state.loading" title="$t(name)">
    <sl-icon slot="prefix" :name="icon"></sl-icon>
    <sl-spinner slot="suffix" v-if="handlerState.loading"></sl-spinner>
    {{ $t(name) }}
  </sl-button>
</template>

<script lang="ts">
//@ts-nocheck
import {reactive, defineComponent, inject, computed} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {useDBStore} from "../../stores/db";
import {Request} from "@viur/vue-utils";
import {useMessageStore} from "../../stores/message";
export default defineComponent({
  props: {
    close: {
      type: Boolean,
      default: false
    },
    name: {
      type: String,
      default: "actions.reload"
    },
    icon: {
      type: String,
      default: "arrow-repeat"
    }

  },
  components: {},
  setup(props, context) {
    const handlerState: any = inject("handlerState");
    const fetchData:any = inject("fetchData")
    const router = useRouter();
    const route = useRoute();
    const dbStore = useDBStore();
    const state = reactive({
      loading:false
    });
    const messageStore = useMessageStore();

    function handleClick(){
      fetchData()
    }

    return {
      state,
      handleClick,
      handlerState,
      route
    }
  }
})
</script>

<style scoped lang="less">

</style>
