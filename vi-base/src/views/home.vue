<template>
  <div class="home">
    <h1 class="main-headline">Hallo Username!</h1>

    <h2 class="headline">Deine Favoriten</h2>

    <div class="home-grid">
        <div class="home-box" v-for="i in 6">
            <div class="icon-wrap">
              <sl-icon name="trash"></sl-icon>
            </div>
            <div class="home-name">
              Dies ist ein Testmodul
            </div>
          </div>
      </div>

    <br>
    <br>

    <h2 class="headline">Zuletzt geöffnet</h2>

    <div class="home-grid">
        <div class="home-box" v-for="n in 6">
            <div class="icon-wrap">
              <sl-icon name="trash"></sl-icon>
            </div>
            <div class="home-name">
              Dies ist ein Testmodul
            </div>
          </div>
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

.home-box{
  display: flex;
  flex-direction: row;
  overflow: hidden;
  border-radius: var(--sl-border-radius-medium);
  border: 1px solid var(--sl-color-neutral-200);
  cursor: pointer;
  background-color: #fff;
  transition: all ease .3s;

  &:hover{
    background-color: var(--sl-color-neutral-50);
    border: 1px solid var(--sl-color-neutral-300);
    color: @mainColor;
  }
}

.home-name{
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 15px;
}

.icon-wrap{
  background-color: @mainColor;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  aspect-ratio: 1;

  sl-icon{
    color: #fff;
    font-size: 1.3em;
  }
}

</style>
