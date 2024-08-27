<template>
  <sl-card class="interaction">
    <div slot="header">
      Alert
    </div>

    <p class="paragraph">
      {{ entry['data']["text"] }}
    </p>

    <sl-button
      variant="success"
      size="small"
      slot="footer"
      @click="pressedOk"
      >OK</sl-button
    >
  </sl-card>
</template>

<script setup>
  import {reactive, computed} from 'vue'

  import {useScriptorStore} from "../../store/scriptor"
  const scriptorStore = useScriptorStore()

  const props = defineProps({
    entry:{
      type:Object
    }
  })

  const state = reactive({
  })

  async function pressedOk(){
    await scriptorStore.sendResult("alert",{})
  }


</script>

<style scoped >

</style>
