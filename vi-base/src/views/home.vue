<template>
  <div class="home">
    <h1 class="main-headline">Hallo {{state.name}}</h1>

    <h2 class="headline">Deine Favoriten</h2>

    <div class="home-grid">
      <widget-small v-for="i in 4">

      </widget-small>
    </div>

    <br>
    <br>

    <h2 class="headline">Zuletzt geöffnet</h2>

    <div class="home-grid">
       <widget-small v-for="i in 4">

      </widget-small>
      </div>
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
import {defineComponent, reactive,computed} from 'vue'
import {useRoute} from "vue-router";
import {useUserStore} from "../stores/user";
import TheMenubarItem from "../components/TheMenubar/TheMenubarItem.vue";
import Utils from "../utils";
import WidgetSmall from "../components/Dashboard/WidgetSmall.vue";

export default defineComponent({
  props: {},
  components: {WidgetSmall, TheMenubarItem},
  setup(props, context) {

    const route = useRoute();
    const userStore = useUserStore();
    const state = reactive({
      name: computed(()=>{
        let name = ""
        if (!userStore.state.user) return name

        if (userStore.state.user["firstname"] && userStore.state.user["lastname"]){
          name = userStore.state.user["firstname"] + " "+userStore.state.user["lastname"]
        }else{
          name = userStore.state.user["name"]
        }
        return name
      })
    });

    function createInitials(name: string) {
      return Utils.nameToInitials(name);
    }


    return {state, route, userStore, createInitials}
  }
})
</script>

<style scoped lang="less">

.home{
  padding: 15px 30px;
  margin: 0 auto;
  width: 100%;
  max-width: 1280px;
}

.main-headline{
  font-size: 2em;
  color: @mainColor;
  margin-bottom: 15px;
  font-weight: 600;
}

.headline{
  font-size: 1.3em;
  margin-bottom: 15px;
  font-weight: 600;
}

.home-grid{
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-gap: 15px;
}
</style>
