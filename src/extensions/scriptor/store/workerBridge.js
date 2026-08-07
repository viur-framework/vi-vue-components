import { useWebWorker } from "@vueuse/core"

// Identisch zur bisherigen Pfadbildung in createWebWorker(): der Worker liegt
// relativ zum Admin-Bundle, nicht unter einem festen Root.
export function resolveWorkerPath(pathname) {
  return `${(pathname || "").replace("/main.html", "")}/scriptor/public/webworker.js`
}

// Hängt die Handler eines Worker-Handles auf eine Instanz-ID um. Beim Recyceln
// eines geparkten Workers wechselt die Bindung, ohne dass ein neuer Worker
// entsteht — die Pyodide-Umgebung bleibt dabei erhalten.
//
// Die Handler MÜSSEN am entpackten Worker hängen: useWebWorker() liefert
// `worker` als shallowRef und setzt dessen .value synchron, solange ein window
// existiert. Innerhalb eines reactive() entpackt Vue den Ref automatisch, hier
// aber nicht. Eine Zuweisung an handle.worker.onmessage würde nur eine
// Eigenschaft am Ref-Wrapper anlegen und niemals ausgelöst werden.
//
// Beim Recycling eines geparkten Workers kommt der Handle allerdings aus einem
// reactive()-Objekt (state.instances[...] bzw. der Parkplatz), nicht direkt aus
// useWebWorker(). Dort hat Vue den Ref schon automatisch entpackt, handle.worker
// ist dann bereits der Worker selbst und besitzt kein .value mehr. Ein echter
// Worker hat aber nie eine .value-Eigenschaft, ein shallowRef immer — daran
// lassen sich beide Formen sauber unterscheiden.
//
// instanceId darf null sein: der Parkplatz nutzt das, um Nachrichten eines
// geparkten Workers abzufangen, solange keine Instanz dahintersteht.
export function rebindInstanceWorker(handle, instanceId, onMessage, onError) {
  const rawWorker = handle?.worker
  const worker = rawWorker && "value" in rawWorker ? rawWorker.value : rawWorker

  if (!worker) {
    return false
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

  return true
}

export function createInstanceWorker({ path, instanceId, onMessage, onError }) {
  const workerObject = useWebWorker(path)

  if (!rebindInstanceWorker(workerObject, instanceId, onMessage, onError)) {
    console.error("Scriptor: web worker could not be created", path)
    return null
  }

  return workerObject
}
