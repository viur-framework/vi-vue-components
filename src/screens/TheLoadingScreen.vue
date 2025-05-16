<template>
  <div class="wrapper">

    <div class="background-img">
      <img :src="state.backgroundImage" />
    </div>

    <div
      class="init-spinner"
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
      backgroundImage: computed(() => `${appStore.state["admin.login.background"]}`),
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
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.wrapper::before {
  content: "";
  opacity: 0.7;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1;
  background: linear-gradient(to top left, var(--sl-color-primary-700), var(--sl-color-primary-500));
}

.background-img {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 0;

  & img {
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
}

.init-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2;
}
</style>
