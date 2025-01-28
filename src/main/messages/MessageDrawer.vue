<template>
  <sl-drawer
    label="System Nachrichten"
    :open="messageStore.state['opened']"
    @sl-request-close="messageStore.state['opened'] = false"
  >
    <message
      v-for="message in messageStore.state.messages"
      :key="message['time']"
      :variant="message['variant']"
      :icon="message['icon']"
      :time="message['time']"
      :headline="message['headline']"
    >
      {{ message["body"] }}
    </message>
  </sl-drawer>

  <div class="messages_target">
    <message
      v-for="message in messageStore.state.messages.slice(0, 3)"
      :key="message['time']"
      :variant="message['variant']"
      :icon="message['icon']"
      :headline="message['headline']"
      :time="message['time']"
      :duration="3000"
    >
      {{ message["body"] }}
    </message>
  </div>
</template>

<script setup>
import { reactive, defineComponent } from "vue"
import Message from "./Message.vue"
import { useMessageStore } from "../../stores/message"
import { useDBStore } from "../../stores/db"

    const messageStore = useMessageStore()
    const dbStore = useDBStore()
    const state = reactive({})
</script>

<style scoped>
.messages_target {
  position: absolute;
  width: 500px;
  right: 25px;
  bottom: 75px;
  z-index: 99;
}
</style>
