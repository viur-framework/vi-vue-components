<template>
  <div class="wrapper">
    <div
      class="init-spinner"
      style="position: relative; height: 100%; width: 100%"
    >
      <loader
        size="8"
        :logo="appStore.state['admin.loader.logo']"
        :color="appStore.state['admin.loader.color']"
      ></loader>


      <sl-dialog :open="appStore.state['failed']" :label="i18n.t('connection.header')" @sl-request-close.prevent="()=>{}">
        {{ $t('connection.message') }}
        <div slot="footer">
          <sl-button variant="success" outline @click="reload" :loading="state.loading">{{$t('refresh')  }}</sl-button>
        </div>
      </sl-dialog>

    </div>
  </div>
</template>

<script setup>
import { reactive, computed, onBeforeMount, defineComponent, ref } from "vue"
import { useAppStore } from "../stores/app"
import Loader from "@viur/vue-utils/generic/Loader.vue"
import { useInitConnection } from "../init"
import { useI18n } from "vue-i18n"

    const appStore = useAppStore()
    const i18n = useI18n()

    useInitConnection()


    const state = reactive({
      backgroundImage: computed(() => `url('${appStore.state["admin.login.background"]}'`),
      loading:false,
    })

    function reload(){
      state.loading=true
      window.location.reload()
    }

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
