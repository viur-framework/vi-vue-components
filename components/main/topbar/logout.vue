<template>
  <sl-button
    ref="logoutBtn"
    size="small"
    variant="default"
    @click="logout"
    class="btn--mobile-simple"
  >
    <sl-icon
      name="logout"
      slot="prefix"
    ></sl-icon>
    <span>Logout</span>
  </sl-button>
</template>

<script lang="ts">
import { reactive, defineComponent } from "vue"
import { useUserStore } from "../../stores/user"

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
