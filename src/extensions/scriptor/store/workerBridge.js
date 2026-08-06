import { useWebWorker } from "@vueuse/core"

// Identisch zur bisherigen Pfadbildung in createWebWorker(): der Worker liegt
// relativ zum Admin-Bundle, nicht unter einem festen Root.
export function resolveWorkerPath(pathname) {
  return `${(pathname || "").replace("/main.html", "")}/scriptor/public/webworker.js`
}

// Erzeugt einen Worker, dessen Nachrichten fest an eine Instanz gebunden sind.
// Die Bindung passiert über die Closure, nicht über die Nachricht selbst —
// genau deshalb braucht der Store keinen globalen Zustand für die aktive
// Instanz mehr. Wichtig, weil stdout/stderr im Worker immer mit id: null senden.
//
// useWebWorker() liefert `worker` als shallowRef und setzt dessen .value
// synchron, solange ein window existiert. Die Handler MÜSSEN am entpackten
// Worker hängen: innerhalb eines reactive() entpackt Vue den Ref automatisch,
// hier aber nicht. Eine Zuweisung an handle.worker.onmessage würde nur eine
// Eigenschaft am Ref-Wrapper anlegen und niemals ausgelöst werden.
export function createInstanceWorker({ path, instanceId, onMessage, onError }) {
  const handle = useWebWorker(path)
  const worker = handle.worker.value

  if (!worker) {
    console.error("Scriptor: web worker could not be created", path)
    return null
  }

  worker.onmessage = (event) => {
    const { id, ...data } = event.data
    onMessage(instanceId, id, data)
  }
  worker.onmessageerror = (error) => {
    onError(instanceId, error)
  }
  worker.onerror = (error) => {
    onError(instanceId, error)
  }

  return handle
}
