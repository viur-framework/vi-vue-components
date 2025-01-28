<template>
  <sl-card class="interaction">
    <div
      v-if="imageURL"
      class="interaction-img"
    >
      <img
        :src="imageURL"
        class=""
      />
    </div>

    <div slot="header">
      <template v-if="!entry.data.title">{{ "diff" }}</template>
      <template v-else>{{ entry.data.title }}</template>
    </div>

    <div class="extended-inter">
      <div
        v-for="(value, index) in entry.data.changes"
        :key="index"
      >
        <div class="container">
          <div class="child-start">{{ value[0] }}</div>
          <div class="child-end">
            <div class="from">
              {{ value[1] }}
            </div>

            <span class="arrow">&#8594;</span>

            <div class="to">
              {{ value[2] }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </sl-card>
</template>

<script setup>
import { useScriptorStore } from "../../store/scriptor"

const scriptorStore = useScriptorStore()

const props = defineProps({
  entry: {
    type: Object
  }
})
</script>

<style scoped>
.interaction-img {
  margin: -10px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: calc(100% + 20px);
  height: 200px;
  margin-bottom: 20px;
  background-color: var(--sl-color-neutral-100);

  img {
    object-fit: contain;
    height: 100%;
  }
}

.container {
  overflow-y: auto;
  display: flex;
  justify-content: space-between;
  gap: 80px;
  align-items: flex-start;
}

.extended-inter {
  overflow-y: auto;
  max-height: 400px;
}

.diff {
  flex: 1 0 50%;
  align-items: flex-start;
}

.diff-start {
  display: flex;
  align-self: flex-start;
}
.diff-end {
  display: flex;
  align-self: flex-end;
}

.container {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  flex-wrap: nowrap;
  margin-bottom: 10px;
}

.child-start {
  display: flex;
  align-items: center;
  order: 0;
  width: 20%;
  padding: 0.4em;
}

.child-end {
  order: 1;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 15px;
  background-color: var(--sl-color-neutral-100);
  padding: 0.4em;
  flex: 1;
}

.from {
  margin-left: 5px;
  color: var(--sl-color-danger-600);
}

.arrow {
  color: var(--sl-color-primary-500);
}

.to {
  color: var(--sl-color-success-600);
}
</style>
