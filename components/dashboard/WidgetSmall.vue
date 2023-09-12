<template>
  <div
    class="home-box"
    @click="openTab"
  >
    <div class="icon-wrap">
      <sl-icon :name="icon" :library="library"></sl-icon>
    </div>
    <div class="home-name">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { reactive, defineComponent } from "vue"
import { useDBStore } from "../stores/db"
import { useRoute } from "vue-router"
export default defineComponent({
  props: {
    icon: String,
    library: {
      type: String,
      default: "default"
    },
    name:String,
    to: Object
  },
  components: {},
  setup(props, context) {
    const state = reactive({})
    const dbStore = useDBStore()
    const route = useRoute()

    function openTab() {
      dbStore.addOpened(props.to, props.to.params["module"], props.to.query["view"],props.name)
    }

    return {
      state,
      openTab
    }
  }
})
</script>

<style scoped>
.icon-wrap {
  background-color: var(--sl-color-primary-500);
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  aspect-ratio: 1;

  & sl-icon {
    color: #fff;
    font-size: 1.3em;
  }
}

.home-box {
  display: flex;
  flex-direction: row;
  overflow: hidden;
  border-radius: var(--sl-border-radius-medium);
  border: 1px solid var(--sl-color-neutral-200);
  cursor: pointer;
  background-color: #fff;
  transition: all ease 0.3s;

  &:hover {
    background-color: var(--sl-color-neutral-50);
    border: 1px solid var(--sl-color-neutral-300);
    color: var(--sl-color-primary-500);
  }
}

.home-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 15px;
}
</style>
