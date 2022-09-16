<template>
    <sl-alert v-if="duration" :variant="variant"
              style="margin-bottom: 10px"
              open
              :duration="duration"
              closable>
        <sl-icon slot="icon" :name="icon" sprite></sl-icon>
        <span style="font-size: 1.2em">{{ headline }} {{ time.toLocaleString() }}</span>
        <br>
        <slot></slot>
    </sl-alert>

    <sl-alert v-else
              :variant="variant"
              style="margin-bottom: 10px"
              open
              closable>
        <sl-icon slot="icon" :name="icon" sprite></sl-icon>
        <span style="font-size: 1.2em">{{ headline }} {{ time.toLocaleString() }}</span>
        <br>
        <slot></slot>
    </sl-alert>
</template>

<script lang="ts">
//@ts-nocheck
import {defineComponent, onMounted, ref} from "vue";

export default defineComponent({
    props: {
        icon: String,
        variant: String,
        headline: String,
        duration: Number,
        time: Date
    },
    setup(props, context) {

    }
})
</script>

<style scoped>

</style>
