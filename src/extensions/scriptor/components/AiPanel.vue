<template>
  <div class="ai-panel">
    <!-- Header -->
    <div class="ai-panel__header">
      <span class="ai-panel__title">✨ KI-Assistent</span>
      <sl-button size="small" variant="neutral" outline @click="clearChat">↺ Neu</sl-button>
    </div>

    <!-- Chat-Verlauf -->
    <div ref="chatContainer" class="ai-panel__chat">
      <div v-if="chat.length === 0" class="ai-panel__empty">Beschreibe was das Script tun soll…</div>

      <div v-for="(msg, idx) in chat" :key="idx" class="ai-panel__message-wrap" :class="msg.role">
        <div
          class="ai-panel__bubble"
          :class="msg.role === 'user' ? 'ai-panel__bubble--user' : 'ai-panel__bubble--assistant'"
        >
          {{ msg.content }}
        </div>
      </div>

      <!-- Typing-Indikator -->
      <div v-if="loading" class="ai-panel__bubble ai-panel__bubble--assistant ai-panel__bubble--loading">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>

    <!-- Eingabe -->
    <div class="ai-panel__input-area">
      <textarea
        v-model="prompt"
        class="ai-panel__textarea"
        placeholder="Was soll das Script tun…"
        rows="3"
        :disabled="loading"
        @keydown.ctrl.enter.prevent="send"
      ></textarea>
      <div class="ai-panel__send-row">
        <span class="ai-panel__hint">Strg+Enter zum Senden</span>
        <sl-button
          size="small"
          variant="primary"
          :loading="loading"
          :disabled="!prompt.trim() || loading"
          @click="send"
        >
          Senden →
        </sl-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from "vue"
import { useScriptorStore } from "../store/scriptor"
import { isScriptorCode } from "../aiResponse"

const props = defineProps({
  instanceId: { type: String, required: true },
  currentCode: { type: String, default: "" },
})

const scriptorStore = useScriptorStore()
const instance = computed(() => scriptorStore.state.instances[props.instanceId])
const chat = computed(() => instance.value?.chatHistory ?? [])

const prompt = ref("")
const loading = ref(false)
const chatContainer = ref(null)

async function scrollToBottom() {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

async function send() {
  const text = prompt.value.trim()
  if (!text || loading.value || !instance.value) return

  // Append the user message.
  instance.value.chatHistory.push({ role: "user", content: text })
  prompt.value = ""
  loading.value = true
  await scrollToBottom()

  try {
    const formData = new FormData()
    formData.append("messages", JSON.stringify(instance.value.chatHistory))

    const resp = await fetch(`${scriptorStore.state.apiUrl}/json/assistant/generate_script`, {
      method: "POST",
      credentials: "include",
      body: formData,
    })

    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`Server error ${resp.status}: ${err}`)
    }

    const data = await resp.json()

    if (isScriptorCode(data.code)) {
      // Open the suggestion as a diff in the editor instead of dumping code
      // into the chat.
      instance.value.pendingDiff = {
        original: props.currentCode,
        modified: data.code,
      }
      instance.value.chatHistory.push({
        role: "assistant",
        content: "✅ Code-Vorschlag im Editor geöffnet – bitte prüfen und übernehmen oder verwerfen.",
      })
    } else {
      // Conversational reply: show it as plain chat text.
      instance.value.chatHistory.push({ role: "assistant", content: data.code })
    }
  } catch (e) {
    instance.value.chatHistory.push({
      role: "assistant",
      content: `Fehler: ${e.message}`,
    })
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}

function clearChat() {
  if (!instance.value) return
  instance.value.chatHistory = []
  instance.value.pendingDiff = null
}
</script>

<style scoped>
.ai-panel {
  background: var(--sl-color-neutral-50, #f8f9fa);
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  font-size: 13px;
}

.ai-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--sl-color-neutral-200, #dee2e6);
  flex-shrink: 0;
}

.ai-panel__title {
  font-weight: 600;
  color: var(--sl-color-primary-600, #4a6cf7);
}

.ai-panel__chat {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-panel__empty {
  color: var(--sl-color-neutral-400, #adb5bd);
  text-align: center;
  margin-top: 24px;
  font-size: 12px;
  line-height: 1.5;
}

.ai-panel__message-wrap {
  display: flex;
  flex-direction: column;
}

.ai-panel__message-wrap.user {
  align-items: flex-end;
}

.ai-panel__message-wrap.assistant {
  align-items: flex-start;
}

.ai-panel__bubble {
  max-width: 95%;
  padding: 8px 10px;
  border-radius: 10px;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
}

.ai-panel__bubble--user {
  background: var(--sl-color-primary-600, #4a6cf7);
  color: #fff;
  border-bottom-right-radius: 3px;
}

.ai-panel__bubble--assistant {
  background: var(--sl-color-neutral-0, #fff);
  border: 1px solid var(--sl-color-neutral-200, #dee2e6);
  border-bottom-left-radius: 3px;
}

/* Typing-Indikator */
.ai-panel__bubble--loading {
  display: flex;
  gap: 4px;
  padding: 12px 14px;
}

.ai-panel__bubble--loading span {
  display: inline-block;
  width: 7px;
  height: 7px;
  background: var(--sl-color-neutral-400, #adb5bd);
  border-radius: 50%;
  animation: typing 1.2s infinite ease-in-out;
}

.ai-panel__bubble--loading span:nth-child(2) {
  animation-delay: 0.2s;
}
.ai-panel__bubble--loading span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%,
  80%,
  100% {
    transform: scale(0.7);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.ai-panel__input-area {
  border-top: 1px solid var(--sl-color-neutral-200, #dee2e6);
  padding: 8px;
  flex-shrink: 0;
}

.ai-panel__textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--sl-color-neutral-300, #ced4da);
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 12px;
  font-family: inherit;
  resize: none;
  background: var(--sl-color-neutral-0, #fff);
  color: var(--sl-color-neutral-900, #212529);
  margin-bottom: 6px;
}

.ai-panel__textarea:focus {
  outline: none;
  border-color: var(--sl-color-primary-500, #4a6cf7);
}

.ai-panel__textarea:disabled {
  background: var(--sl-color-neutral-100, #f0f0f0);
  cursor: not-allowed;
}

.ai-panel__send-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ai-panel__hint {
  font-size: 10px;
  color: var(--sl-color-neutral-400, #adb5bd);
}
</style>
