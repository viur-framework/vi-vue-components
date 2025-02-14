<template>
  <sl-alert
    variant="neutral"
    open
  >

    <div  v-for="_entry in props.entry.data.components">


      <component
        :is="getWidget(_entry['type'])"
        ref="elements"
        :entry="{data:_entry}"
        :inMultiple="true"
      ></component>
    </div>

    <sl-button
      @click="buttonCallback"
      :disabled="state.buttonDisabled || !state.sendable"
    >
      send
    </sl-button>
  </sl-alert>
</template>

<script setup>
import {computed, reactive, ref} from "vue"
import {useScriptorStore} from "../../store/scriptor"
import widgets from "./index"


const elements = ref([]);
const scriptorStore = useScriptorStore()


const props = defineProps({
  entry: {
    type: Object
  }
})


const state = reactive({
  buttonDisabled: false,
  sendable: computed(() => {
    for (const el of elements.value) {
      if (!el.state.sendable) {
        return false
      }
    }
    return true
  })
})

async function buttonCallback() {
  const result = []
  for (const el of elements.value) {
    result.push(el.state.value)
  }
  await scriptorStore.sendResult("textResult", JSON.stringify(result))
}

//todo zusammen fassen
function getWidget(type) {
  if (["install", "err", "stdout", "stderr", "log", "info", "error", "debug", "warning"].includes(type)) {
    return widgets.logEntry
  } else if (["alert"].includes(type)) {
    return widgets.alertEntry
  } else if (["select"].includes(type)) {
    return widgets.selectEntry
  } else if (["input"].includes(type)) {
    return widgets.textInput
  } else if (["diffcmp"].includes(type)) {
    return widgets.diffCompare
  } else if (["table"].includes(type)) {
    return widgets.tableEntry
  }

  return widgets.debugEntry
}

//todo find better solution
function makeid(length = 10) {
  let result = ""
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result
}


</script>
