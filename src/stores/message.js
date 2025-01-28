import { reactive } from "vue"
import { defineStore } from "pinia"

const types = {
  error: { icon: "exclamation-octagon", variant: "danger" },
  warning: { icon: "exclamation-triangle", variant: "warning" },
  info: { icon: "info-circle", variant: "info" },
  success: { icon: "check", variant: "success" }
}

export const useMessageStore = defineStore("messageStore", () => {
  const state = reactive({
    opened: false,
    messages: [],
    maxMessages: 15
  })

  function addMessage(type, headline, body) {
    state.messages.unshift({ ...types[type], headline, body, ...{ time: new Date() } })

    if (state.messages.length > state.maxMessages) {
      state.messages.pop()
    }
  }

  return { state, addMessage }
})
