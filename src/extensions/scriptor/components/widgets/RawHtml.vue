<template>
  <div v-if="state.codeOk" v-html="entry.data.html"></div>
  <span v-else class="error">Der Code enthält unerlaubte Zeichen, weshalb die Ausführung unterbunden wurde.</span>
</template>

<script setup>
import { reactive, computed, onMounted } from "vue"

import { useScriptorStore } from "../../store/scriptor"
const scriptorStore = useScriptorStore()

const props = defineProps({
  entry: {
    type: Object,
  },
  inMultiple: {
    type: Boolean,
    default: false,
  },
  dataKey:{type:String},
})

const state = reactive({
  codeOk: computed(() => {
    let code = props.entry.data.html
    if (/\s*on\w+="[^"]*"|\s*on\w+='[^']*'/g.test(code)) return false
    code = code.replace(/\s+/g, "") //remove all spaces
    if (
      [
        "<script",
        "<style",
        "<applet",
        "<iframe",
        "<link",
        "<meta",
        "<noscript",
        "<object",
        "<embed",
        "<comment",
        "<listing",
        "<plaintext",
        "<xmp",
        "<frame",
        "<frameset",
        "javascript:",
        "a[href",
        "alert(",
        "url(",
        "window.",
        "document.",
        "location.",
      ].some((x) => code.includes(x))
    ) {
      return false
    }

    return true
  }),
})

onMounted(async () => {
  if (!props.inMultiple) {
    await scriptorStore.sendResult("htmlResult", {})
  }
})
</script>

<style scoped>
.error {
  color: var(--sl-color-danger-500);
  font-weight: bold;
  font-style: italic;
  font-size: 0.7rem;
}
</style>
