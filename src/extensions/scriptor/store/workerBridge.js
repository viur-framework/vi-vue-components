import { useWebWorker } from "@vueuse/core"

// Identisch zur bisherigen Pfadbildung in createWebWorker(): der Worker liegt
// relativ zum Admin-Bundle, nicht unter einem festen Root.
export function resolveWorkerPath(pathname) {
  return `${(pathname || "").replace("/main.html", "")}/scriptor/public/webworker.js`
}

// Erzeugt einen Worker, dessen Nachrichten fest an eine Instanz gebunden sind.
// Die Bindung passiert über die Closure, nicht über die Nachricht selbst — genau
// deshalb braucht der Store keinen globalen "currentInstance"-Zustand mehr.
// Wichtig, weil stdout/stderr im Worker immer mit id: null senden.
export function createInstanceWorker({ path, instanceId, onMessage, onError }) {
  const workerObject = useWebWorker(path)
  const worker = workerObject.worker

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

  return workerObject
}
