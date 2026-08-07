<template>
  <sl-button
    v-if="canAccess"
    size="small"
    :disabled="(!active && !state.scriptReady) || disabled"
    :title="current['rel']['name']"
    @click="startScriptor"
  >
    <sl-icon v-if="current['rel']['icon']" slot="prefix" :name="iconInfo[1]" :library="iconInfo[0]"></sl-icon>
    <template v-if="!iconOnly">
      {{ current["rel"]["name"] }}
    </template>

    <div v-show="state.id">
      <status :id="state.id" ref="scriptorAction"></status>
    </div>
  </sl-button>

  <teleport v-if="state.opened" :to="`#view_dialogs_${handlerState.tabId}`" :disabled="!state.opened">
    <sl-dialog
      id="dialog-delete"
      ref="runnerDialog"
      style="--width: 85%"
      :open="state.opened"
      :label="current['rel']['name']"
      @sl-after-hide="handleAfterHide"
      @sl-request-close="handleRequestClose"
    >
      <sl-icon-button
        slot="header-actions"
        name="dash"
        :label="$t('actions.minimize')"
        @click="minimizeScriptor"
      ></sl-icon-button>

      <div ref="messagewrapper" class="wrapper-widgets">
        <status-bar :id="state.id" :filename="current['dest']['name']"></status-bar>

        <widget-list :id="state.id"></widget-list>
      </div>
    </sl-dialog>
  </teleport>
</template>

<script setup>
import { onBeforeMount, onBeforeUnmount, reactive, ref, computed, inject, watch } from "vue"
import WidgetList from "./components/WidgetList.vue"
import StatusBar from "./components/StatusBar.vue"
import Status from "./components/Status.vue"
import { useScriptorStore } from "./store/scriptor"
import { Request } from "@viur/vue-utils"
import Utils from "../../utils"
import { useDebounceFn } from "@vueuse/core"

const messagewrapper = ref(null)
const scriptorAction = ref(null)
const runnerDialog = ref(null)

const handlerState = inject("handlerState")
const emit = defineEmits(["start", "exit"])
const props = defineProps({
  canAccess: {
    type: Boolean,
  },
  current: {
    type: Object,
  },
  iconInfo: {
    type: Array,
  },
  active: {
    type: Boolean,
  },
  iconOnly: {
    type: Boolean,
  },
  disabled: {
    type: Boolean,
  },
  scriptParams: {
    type: Object,
  },
})

const scriptorStore = useScriptorStore()
const state = reactive({
  id: null,
  opened: false,
  scriptor: computed(() => {
    return scriptorStore.state.instances[state.id]
  }),
  scriptReady: false,
  // Markiert, dass der Dialog absichtlich ausgeblendet wurde und die Instanz
  // weiterleben soll. Ohne dieses Flag würde der sl-after-hide-Handler das
  // Minimieren nicht vom Schließen unterscheiden können.
  minimized: false,
})

function startScriptor(params = {}) {
  // Minimiertes Fenster: nur wieder einblenden, nicht erneut ausführen. Das
  // Flag wird hier ebenfalls zurückgesetzt, weil sl-after-hide beim Minimieren
  // möglicherweise nie gefeuert hat.
  if (state.id && !state.opened) {
    state.minimized = false
    state.opened = true
    return
  }
  emit("start")
  state.opened = true
  params = { ...params, ...props.scriptParams }
  if (!state.id) {
    state.id = scriptorStore.createNewInstance()
    const openedId = state.id
    Request.view("script", props.current?.["dest"]?.["key"], { group: "leaf" }).then(async (resp) => {
      // Fenster inzwischen geschlossen: die Instanz existiert nicht mehr.
      if (state.id !== openedId) {
        return
      }
      const data = await resp.json()
      state.scriptor.scriptCode = data["values"]["script"].replace(/\/\/n/g, "\n")
      state.scriptReady = true
      scriptorAction.value.executeScript(params)
    })
    return
  }
  if (import.meta.env.DEV) {
    const openedId = state.id
    Request.view("script", props.current?.["dest"]?.["key"], { group: "leaf" }).then(async (resp) => {
      if (state.id !== openedId) {
        return
      }
      const data = await resp.json()
      state.scriptor.scriptCode = data["values"]["script"].replace(/\/\/n/g, "\n")
      state.scriptReady = true
      scriptorAction.value.executeScript(params)
    })
  } else {
    scriptorAction.value.executeScript(params)
  }
}

// Blendet den Dialog aus, ohne die Instanz abzuräumen: Worker, Ausgaben und ein
// laufendes Skript bleiben bestehen. Zurück geht es über den Skript-Button.
function minimizeScriptor() {
  state.minimized = true
  state.opened = false
}

// sl-dialog schließt von sich aus bei Klick auf das Overlay und bei Escape.
// Beides würde über sl-after-hide die Instanz abräumen und einen laufenden
// Skriptlauf verlieren. Der Klick daneben wird deshalb ganz unterbunden,
// Escape minimiert. Damit ist das Schließen-X der einzige zerstörende Weg.
function handleRequestClose(event) {
  const source = event.detail?.source

  if (source === "overlay") {
    event.preventDefault()
    return
  }

  if (source === "keyboard") {
    event.preventDefault()
    minimizeScriptor()
  }
}

// Auf sl-after-hide ist beim Minimieren kein Verlass: dort entfernt
// state.opened = false den Teleport sofort per v-if, sodass der Dialog
// verschwindet, bevor das Ereignis feuern kann. Beim Klick auf das X feuert es
// dagegen zuverlässig, weil Shoelace erst intern schließt und erst exitScriptor
// state.opened setzt. Deshalb wird das Flag hier UND in startScriptor
// zurückgesetzt — auf einen der beiden Wege allein ist kein Verlass.
function handleAfterHide() {
  if (state.minimized) {
    state.minimized = false
    return
  }
  exitScriptor()
}

function exitScriptor() {
  emit("exit")
  state.opened = false
  // exitScriptor ist über defineExpose auch von außen aufrufbar. Bliebe das
  // Flag bei einem Aufruf während minimiert stehen, würde es den
  // Zustandsautomaten (siehe handleAfterHide/startScriptor) danach blockieren.
  state.minimized = false
  if (state.id) {
    scriptorStore.destroyInstance(state.id)
  }
  // Zurücksetzen ist zwingend: startScriptor() prüft `if (!state.id)`, um Code zu
  // laden und eine Instanz anzulegen. Bliebe die alte ID stehen, würde der
  // Dialog beim Wiederöffnen auf eine gelöschte Instanz zugreifen und
  // state.scriptor wäre undefined.
  state.id = null
  state.scriptReady = false
}

// Der Runner sitzt in der Aktionsleiste eines Handlers. Diese Leiste hängt in
// einem keep-alive (main/ViewWrapper.vue, gespeist aus stores/views.js) — beim
// Tabwechsel oder beim Öffnen eines anderen Datensatzes wird sie nur
// deaktiviert, nicht ausgehängt. Dieser Hook feuert deshalb erst beim
// Schließen des ViUR-Tabs selbst. Ein minimiertes Fenster soll den Tabwechsel
// ausdrücklich überleben — käme onBeforeUnmount schon dort zum Zug, ginge das
// verloren. Beim tatsächlichen Aushängen räumt er auf, weil state.id sonst mit
// der Leiste verloren ginge, während Instanz und Worker im Store weiterleben
// und über nichts mehr erreichbar sind. Der Worker geht dabei nicht verloren:
// destroyInstance parkt ihn, sofern seine Umgebung geladen ist.
onBeforeUnmount(() => {
  if (state.id) {
    scriptorStore.destroyInstance(state.id)
  }
  // Ohne dieses Zurücksetzen erkennt der Guard in startScriptor()
  // (`state.id !== openedId`) einen zwischenzeitlich abgebrochenen
  // Ladevorgang nicht mehr, und ein noch laufender Request.view-Callback
  // schreibt später auf state.scriptor, das nach dem Abräumen undefined ist.
  state.id = null
})

watch(
  () => state.scriptor?.messages.length,
  (newVal, oldVal) => {
    // newVal ist undefined, sobald exitScriptor() die Instanz abgeräumt und
    // state.id genullt hat. Dann gibt es keine Nachrichten mehr zu scrollen.
    if (newVal === undefined || !messagewrapper.value) {
      return
    }
    const scroller = useDebounceFn((event) => {
      // Der Dialog hängt am `v-if` des Teleports und kann zwischen dem
      // Auslösen des Watchers und dem Ablauf des Debounce verschwunden sein —
      // beim Schließen passiert genau das.
      runnerDialog.value?.shadowRoot?.querySelector(".dialog__body")?.scroll(0, 99999)
    }, 1)
    scroller()
  }
)
defineExpose({ startScriptor, exitScriptor })
</script>

<style scoped>
.wrapper-widgets {
  overflow-y: auto;
}

.tabpopup {
  &::part(base) {
    position: absolute;
    height: 100%;
  }

  &::part(panel) {
    height: 100%;
    max-height: calc(100% - 100px);
    margin-bottom: 40px;
  }

  &::part(body) {
    padding: 0;
    /*display: contents;*/
  }

  &::part(footer) {
    padding: var(--sl-spacing-small);
  }

  &::part(overlay) {
    position: absolute;
  }

  &:deep(.bar sl-button[variant="success"]) {
    &::part(base) {
      background-color: transparent;
      border: 1px solid var(--sl-color-success-500);
      aspect-ratio: 1;
      padding: 0;
    }

    &::part(label) {
      display: none;
    }

    &::part(prefix) {
      color: var(--sl-color-success-500);
    }
  }
}
</style>
