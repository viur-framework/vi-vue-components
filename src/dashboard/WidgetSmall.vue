<template>
  <div
    class="home-box"
    @click="openTab"
  >
    <div class="icon-wrap">
      <sl-icon
            v-if="icon"
            slot="icon"
            :name="icon"
            :library="library"
            sprite
          ></sl-icon>
      <span v-else>
        {{ name?.[0] || to.params["module"] }}
      </span>
    </div>


    <div class="home-name">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { reactive, defineComponent } from "vue"
import { useDBStore } from "../stores/db"
import { useRoute } from "vue-router"

  const props = defineProps({
    icon: String,
    library: {
      type: String,
      default: "default"
    },
    name:String,
    to: Object
  })

    const state = reactive({})
    const dbStore = useDBStore()
    const route = useRoute()

    function openTab() {
      dbStore.addOpened(props.to, props.to.params["module"], props.to.query["view"],props.name)
    }

</script>

<style scoped>
.icon-wrap {
  background-color: var(--sl-color-primary-500);
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px;
  aspect-ratio: 1;
  padding: 10px;

  & sl-icon {
    color: #fff;
    font-size: 1.3em;
  }

  span{
    font-size: 1.3em;
    color: #fff;
  }
}

.home-box {
  display: flex;
  flex-direction: row;
  overflow: hidden;
  border-radius: var(--sl-border-radius-medium);
  border: 1px solid var(--vi-border-color);
  cursor: pointer;
  background-color: #fff;
  transition: all ease 0.3s;

  &:hover {
    background-color: var(--sl-color-neutral-50);
    color: var(--sl-color-primary-500);
    font-weight: 600;
  }
}

.home-name {
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 100%;
  padding-left: 15px;
}
</style>
