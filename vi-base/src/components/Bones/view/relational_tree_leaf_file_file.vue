<template>
    <span v-if="!skel?.[boneName]">-</span>
    <div class="img-wrapper" v-else-if="skel[boneName]['dest']['mimetype'].startsWith('image/')">
        <img
            :src="Request.downloadUrlFor(skel[boneName],false)"
            :alt="skel['name']"
        />
    </div>
    <template v-else>
        <a :href="Request.downloadUrlFor(skel[boneName])" target="_blank">
            <bone-base :skel="skel" :structure="structure" :boneName="boneName"></bone-base>
        </a>
    </template>
</template>

<script lang="ts">
import BoneBase from "./base_item.vue"
import {Request} from "@viur/viur-vue-utils";
import {defineComponent} from "vue";

export default defineComponent({
    components: {BoneBase},
    props: {
        boneName: {
            type: String,
            required: true
        },
        skel: Object,
        structure: Object,
    },
    setup(props, context) {
        //
        return {Request}
    }
})
</script>

<style scoped lang="less">
.img-wrapper {
    width: 100px;
    height: 100px;

    img {
        background-size: contain;
    }
}
</style>
