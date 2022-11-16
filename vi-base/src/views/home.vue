<template>
    <div class="home">
        Home
    </div>
  <div v-for="action in userStore.state.lastActions">
    <router-link :to="action.url" >
      {{action["url"]}}
    </router-link>
  </div>
</template>

<script lang="ts">
import {defineComponent, reactive} from 'vue'
import {useRoute} from "vue-router";
import {useUserStore} from "../stores/user";

export default defineComponent({
    props: {},
    components: {},
    setup(props, context) {
        const route = useRoute();
        const userStore = useUserStore();
        const state = reactive({})
        return {state, route,userStore}
    }
})
</script>

<style scoped lang="less">

</style>
