<template>
  <sl-button
    ref="logoutBtn"
    size="small"
    variant="default"
    class="btn--mobile-simple"
    @click="logout"
  >
    <sl-icon
      slot="prefix"
      name="logout"
    ></sl-icon>
    <span>Logout</span>
  </sl-button>
</template>

<script lang="ts">
import { reactive, defineComponent } from "vue"
import { useUserStore } from "@viur/vue-utils/login/stores/user"

export default defineComponent({
  props: {},
  components: {},
  setup(props, context) {
    const state = reactive({})
    const userStore = useUserStore()

    function logout() {
      userStore.logout()
    }

    return {
      state,
      logout
    }
  }
})
</script>

<style scoped></style>
