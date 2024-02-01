<template>
  <div class="group">
    <div
      class="seperator"
      @click="openGroup"
    >
      <sl-icon
        v-if="icon"
        slot="icon"
        :name="icon"
        :library="library"
      ></sl-icon>

      <span v-if="name">{{ name }}</span>
      <span v-else> &nbsp;</span>

      <sl-icon
        v-if="state.slotitems"
        name="caret-right-fill"
        class="arrow"
        :class="{ 'is-open': state.open }"
      >
      </sl-icon>
    </div>
    <div
      v-show="state.open"
      class="list"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { reactive, onMounted, defineComponent } from "vue"
import Utils from "../../utils"

export default defineComponent({
  name: "TheMenubarGroup",
  props: {
    closed: {
      type: Boolean,
      default: false
    },
    name: {
      type: String,
      default: undefined
    },
    icon: {
      type: String,
      default: undefined
    },
    library: {
      type: String,
      default: "default"
    }
  },
  setup(props, context) {
    const state = reactive({
      open: !props.closed,
      slotitems: 0
    })

    function openGroup() {
      state.open = !state.open
    }

    onMounted(() => {
      state.slotitems = Utils.getSlotLength(context.slots.default)
    })

    return {
      state,
      openGroup
    }
  }
})
</script>

<style scoped>
.group {
  width: 100%;
}

.seperator {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: 0 0 auto;
  padding: 5px 7px 6px 7px;
  font-size: 0.8em;
  font-weight: 600;
  border-bottom: 1px solid var(--vi-foreground-color);
  width: 100%;
  gap: 10px;
  cursor: pointer;
  color: var(--vi-foreground-color);

  &:hover {
    .arrow {
      opacity: 1;
    }
  }
}

span {
  width: 100%;
  text-align: left;
}

.arrow {
  transition: all ease 0.3s;
  font-size: 0.6em;
  opacity: 0;

  &.is-open {
    transform: rotate(90deg);
  }

  & .list {
    width: 100%;
    height: auto;
  }
}
</style>
