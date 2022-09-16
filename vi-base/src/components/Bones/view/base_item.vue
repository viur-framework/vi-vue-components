<template>
    {{ getBoneValue(boneName, structure[boneName]["type"] === "date" ? "date" : null) }}
</template>

<script lang="ts">
//@ts-nocheck
import boneLogic from "../../../scripts/boneLogic";
import {defineComponent} from "vue";

export default defineComponent({
    props: {
        boneName: String,
        skel: Object,
        structure: Object,
    },
    setup(props, context) {
        const {getBoneValue, bones_state} = boneLogic(props.skel, props.structure)
        return {getBoneValue}
    }
})
</script>

<style scoped>

</style>
