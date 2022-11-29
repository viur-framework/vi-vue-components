<template>
  <div class="home">
    Home
  </div>
  <router-link :to="action.url" v-for="action in userStore.state.lastActions">
    <sl-avatar :initials="action.icon!==''?'':createInitials(action.name)">
      <sl-icon slot="icon"
               :name="action.icon.split('___')[1]"
               :library="action.icon.split('___')[0]"
               v-if="action.icon.length>0"></sl-icon>
    </sl-avatar>

    {{ `(${new Date(action.time).toLocaleString()}) ${action.name}` }}
  </router-link>
</template>

<script lang="ts">
import {defineComponent, reactive} from 'vue'
import {useRoute} from "vue-router";
import {useUserStore} from "../stores/user";
import TheMenubarItem from "../components/TheMenubar/TheMenubarItem.vue";
import Utils from "../utils";

export default defineComponent({
  props: {},
  components: {TheMenubarItem},
  setup(props, context) {

    const route = useRoute();
    const userStore = useUserStore();
    const state = reactive({});

    function createInitials(name: string) {
      return Utils.nameToInitials(name);
    }


    return {state, route, userStore, createInitials}
  }
})
</script>

<style scoped lang="less">

</style>
