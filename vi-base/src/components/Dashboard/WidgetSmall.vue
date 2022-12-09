<template>
<div class="home-box">
  <div class="icon-wrap">
    <sl-icon name="trash"></sl-icon>
  </div>
  <div class="home-name">
    Dies ist ein Testmodul
  </div>
</div>
</template>

<script lang="ts">
import {reactive, defineComponent} from 'vue'

export default defineComponent({
  props: [],
  components: {},
  setup(props, context) {
    const state = reactive({})
    return {
      state
    }
  }
})
</script>

<style scoped lang="less">
.icon-wrap{
  background-color: var(--sl-color-primary-500);
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
</style>