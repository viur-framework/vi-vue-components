<template>
  <div class="home">
    <h1 class="main-headline">Hallo {{ state.name }}</h1>

    <template v-if="userStore.favoriteModules?.length>0">

      <h2 class="headline">Deine Favoriten</h2>
      <div class="home-grid">
        <widget-small v-for="i in userStore.favoriteModules"
                      :icon="i['icon']"
                      :library="i['library']"
                      :to="i['to']"
        >
          {{ i['name'] }}
        </widget-small>
      </div>
    </template>
    <br>
    <br>
    <template v-if="userStore.state.lastActions.length>0">
      <h2 class="headline">Zuletzt geöffnet</h2>

      <div class="home-grid">
        <widget-small v-for="i in userStore.state.lastActions"
                      :icon="i['icon']?.split('___')[1]"
                      :library="i['library']?.split('___')[0]"
                      :to="i['url']"
        >
          {{ i['name'] }}
        </widget-small>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
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
      name: computed(() => {
        let name = ""
        if (!userStore.state.user) return name

        if (userStore.state.user["firstname"] && userStore.state.user["lastname"]) {
          name = userStore.state.user["firstname"] + " " + userStore.state.user["lastname"]
        } else {
          name = userStore.state.user["name"]
        }
        return name
      })
    });

    function createInitials(name: string) {
      return Utils.nameToInitials(name);
    }


    return {
      state,
      route,
      userStore,
      createInitials
    }
  }
})
</script>

<style scoped lang="less">

.home {
  padding: 15px 30px;
  margin: 0 auto;
  width: 100%;
  max-width: 1280px;
  flex: 1;
  overflow-y: auto;
  color: var(--sl-foreground-color)
}

.main-headline {
  font-size: 2em;
  margin-bottom: 15px;
  font-weight: 600;
}

.headline {
  font-size: 1.3em;
  margin-bottom: 15px;
  font-weight: 600;
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-gap: 15px;
}
</style>
