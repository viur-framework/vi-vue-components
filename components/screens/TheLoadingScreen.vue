<template>
  <div class="wrapper">
    <div class="init-spinner"  style="position: relative;height:100%;width: 100%;">
        <loader size="8" logo="s/dt-logos/duschtec.svg" color="#8e488a"></loader>
      </div>
  </div>

</template>

<script lang="ts">
import {reactive, computed, onBeforeMount, defineComponent, ref} from 'vue'
import {useAppStore} from "../stores/app";
import Loader from "@viur/vue-utils/generic/Loader.vue"
import {useInitConnection} from "../init";

export default defineComponent({
  components: {Loader},
  setup() {
    const appStore = useAppStore()
    useInitConnection()

    //@ts-ignore
    const state = reactive({
      backgroundImage:computed(() => `url('${appStore.state["admin.login.background"]}'`),
    })

    return {
      state
    }
  },


})
</script>

<style scoped>
.wrapper {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: v-bind("state.backgroundImage");
  background-position: center center;
  background-size: cover;
}

.init-spinner {
  display: flex;
  justify-content: center;
}

</style>
