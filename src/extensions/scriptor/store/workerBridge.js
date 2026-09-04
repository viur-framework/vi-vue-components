import { useWebWorker } from "@vueuse/core"

// Same path logic as the former createWebWorker(): the worker lives relative
// to the admin bundle, not under a fixed root.
export function resolveWorkerPath(pathname) {
  return `${(pathname || "").replace("/main.html", "")}/scriptor/public/webworker.js`
}

// Rebinds a worker handle's handlers to an instance ID. Recycling a parked
// worker just swaps this binding, without creating a new worker — the
// Pyodide environment survives.
//
// Handlers MUST attach to the unwrapped worker: useWebWorker() returns
// `worker` as a shallowRef and sets its .value synchronously as long as a
// window exists. Inside a reactive(), Vue unwraps the ref automatically;
// here it does not. Assigning to handle.worker.onmessage directly would just
// add a property to the ref wrapper and never fire.
//
// When recycling a parked worker, though, the handle comes from a reactive()
// object (state.instances[...] or the parking slot), not straight from
// useWebWorker(). There Vue has already unwrapped the ref, so handle.worker
// is the worker itself with no .value. A real worker never has a .value
// property, a shallowRef always does — that's how the two cases are told apart.
//
// instanceId may be null: the parking slot uses that to intercept messages
// from a parked worker while no instance is behind it yet.
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
