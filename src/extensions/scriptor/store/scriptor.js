// @ts-nocheck
import { computed, reactive } from "vue"
import { defineStore } from "pinia"
import { useBrowserLocation, useUrlSearchParams } from "@vueuse/core"
import { useContextStore } from "../../../stores/context"
import { useMessageStore } from "../../../stores/message"
import { Request } from "@viur/vue-utils"
import { readEnvCache, writeEnvCache, dropEnvCache } from "./envCache"
import { createInstanceWorker, rebindInstanceWorker, resolveWorkerPath } from "./workerBridge"
import { parkWorker, takeParkedWorker, clearParkedWorker } from "./workerPool"

// Shared for the whole session: the importable ZIP is identical for every worker.
const env = {
  importable: undefined,
  importableLoaded: false,
  loadingLock: null,
  releaseLoadingLock: null,
}

// Pyodide uses roughly 150-300 MB per instance. Three parallel workers balance
// usefulness against memory usage.
const MAX_WORKERS = 3
// How long a second worker waits on the first one's cold start when the cache
// is empty, before resolving on its own.
const COLD_START_WAIT_MS = 30000
// How long a new window waits for a parked worker's reset confirmation. On
// timeout the aborted script was stuck in an await-less loop — the worker is
// terminated and started normally instead.
const RESET_WAIT_MS = 2000

export const useScriptorStore = defineStore("scriptorStore", () => {
  const state = reactive({
    pyoPackages: [],
    packages: [],
    initCode: "",
    apiUrl: computed(() => {
      //api Server could be a different server
      if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL
      }
      return useBrowserLocation().value.origin
    }),
    instances: reactive({}),
    scriptorVersion: "latest",
    // Set true once StatusBar.vue has preset a version. Restoring from
    // minimized remounts StatusBar, which must not overwrite a version chosen since.
    scriptorVersionInitialized: false,
  })

  function setProgress(instanceId, total, step, max_step, txt) {
    const instance = state.instances[instanceId]
    if (!instance) {
      return
    }
    instance.progress.total = total
    instance.progress.step = step
    instance.progress.max_step = max_step
    instance.progress.txt = txt
  }

  const DEFAULT_SCRIPT_CODE =
    "#### scriptor ####\nfrom viur.scriptor import *\n\nasync def main():\n    logger.info('Hello World')"

  // Factory instead of a shared object literal: spreading { messages: [] }
  // only copies the array reference, which used to make all instances share
  // the same messages/messageBuffer/internalMessages array.
  function newInstanceState() {
    return reactive({
      scriptKey: null,
      scriptCode: DEFAULT_SCRIPT_CODE,
      messages: [],
      messageBuffer: [],
      internalMessages: [],
      hideInternalMessages: false,
      worker: null,
      envState: "cold", // cold | loading | ready | failed
      // Version the environment was actually installed with. Not derivable
      // from cacheVersion(): StatusBar.vue's changeVersion() sets
      // state.scriptorVersion before calling destroyInstance(), so the parked
      // worker would otherwise be tagged with the new version and silently
      // run the wrong one next time.
      envVersion: null,
      runState: "idle", // idle | running | done | error
      progress: { total: 100, step: -1, max_step: -1, txt: "" },
      pendingActions: new Map(),
    })
  }

  function createNewInstance(id = null) {
    const instanceId = id || new Date().getTime().toString()
    if (!Object.keys(state.instances).includes(instanceId)) {
      state.instances[instanceId] = newInstanceState()
    }
    return instanceId
  }

  function attachWorker(instanceId) {
    const instance = state.instances[instanceId]
    if (!instance || instance.worker) {
      return instance?.worker || null
    }
    const workerObject = createInstanceWorker({
      path: resolveWorkerPath(useBrowserLocation().value.pathname),
      instanceId: instanceId,
      onMessage: handleMessage,
      onError: failInstance,
    })
    if (!workerObject) {
      // Worker could not be created — instance stays cold, caller aborts.
      instance.envState = "failed"
      return null
    }
    instance.worker = workerObject
    startBufferFlusher()
    return instance.worker
  }

  function activeWorkerCount() {
    return Object.values(state.instances).filter((instance) => instance.worker).length
  }

  // Tries to take over the parked worker for this instance. On success the
  // Pyodide environment is already up and load() is skipped entirely.
  async function adoptParkedWorker(instanceId) {
    const parked = takeParkedWorker()
    if (!parked) {
      return false
    }

    const instance = state.instances[instanceId]
    if (!instance) {
      parked.handle?.terminate()
      return false
    }

    // An environment with the wrong Scriptor version is unusable — otherwise
    // the window would silently run a different version than displayed.
    if (parked.version !== cacheVersion()) {
      if (import.meta.env.DEV) {
        console.log(`[scriptor] ${instanceId}: dropped parked worker — version mismatch`, {
          parked: parked.version,
          expected: cacheVersion(),
        })
      }
      parked.handle?.terminate()
      return false
    }

    // The timeout runs from the close, not from here: if the worker has been
    // parked a while, the confirmation already arrived and there's no wait.
    const resetDone = await Promise.race([
      parked.resetPromise,
      new Promise((resolve) => window.setTimeout(() => resolve(false), RESET_WAIT_MS)),
    ])

    if (!resetDone) {
      if (import.meta.env.DEV) {
        console.log(`[scriptor] ${instanceId}: dropped parked worker — reset not confirmed`)
      }
      parked.handle?.terminate()
      return false
    }

    // During the up-to-RESET_WAIT_MS wait, destroyInstance() may have removed
    // the instance (window closed again meanwhile). The reference read before
    // the await would then be stale — re-read from state.instances, otherwise
    // the worker attaches to a dead object and leaks (see activeWorkerCount()).
    const currentInstance = state.instances[instanceId]
    if (!currentInstance) {
      parked.handle?.terminate()
      return false
    }

    if (!rebindInstanceWorker(parked.handle, instanceId, handleMessage, failInstance)) {
      parked.handle?.terminate()
      return false
    }

    currentInstance.worker = parked.handle
    currentInstance.envState = "ready"
    currentInstance.envVersion = parked.version
    startBufferFlusher()

    if (import.meta.env.DEV) {
      console.log(`[scriptor] ${instanceId}: adopted parked worker — no loading needed`)
    }

    return true
  }

  async function acquireWorker(instanceId) {
    const instance = state.instances[instanceId]
    if (!instance) {
      return false
    }
    if (instance.worker) {
      return true
    }
    if (await adoptParkedWorker(instanceId)) {
      return true
    }
    if (activeWorkerCount() >= MAX_WORKERS) {
      useMessageStore().addMessage(
        "error",
        "Zu viele Skripte",
        `Es können maximal ${MAX_WORKERS} Skripte gleichzeitig laufen. Bitte ein laufendes Skript-Fenster schließen.`
      )
      return false
    }
    if (!attachWorker(instanceId)) {
      // Without this message a failed worker start stays invisible to the
      // user: execute() only returns {error}, and both UI call sites discard it.
      useMessageStore().addMessage(
        "error",
        "Skriptor konnte nicht gestartet werden",
        "Der Web Worker ließ sich nicht erzeugen. Bitte die Seite neu laden."
      )
      return false
    }
    return true
  }

  function failInstance(instanceId, error) {
    console.error("Scriptor worker error", instanceId, error)
    const instance = state.instances[instanceId]
    if (!instance) {
      return
    }
    instance.envState = "failed"
    instance.runState = "error"
    addMessageEntry("error", instanceId, { msg: error?.message || String(error) })
    // Resolve callbacks so nothing waits forever on the dead worker.
    for (const [actionId, callback] of instance.pendingActions.entries()) {
      callback({ results: null, error: "worker_error" })
      instance.pendingActions.delete(actionId)
    }
    instance.worker?.terminate()
    instance.worker = null
  }

  // In-flight env loads per instance. Kept outside state.instances on purpose
  // so Vue doesn't wrap the promise in a reactive proxy.
  const envLoads = new Map()

  // Sends the reset command to the worker and returns a promise for its
  // confirmation. From here the handlers point at the parking slot, not an
  // instance: destroyInstance() removes the instance right after, so
  // instance.pendingActions could no longer deliver it — handleMessage() bails
  // on the missing entry. Everything but the confirmation is discarded,
  // including the aborted script's last output.
  function resetWorker(handle) {
    return new Promise((resolve) => {
      const onPoolMessage = (_instanceId, messageId, data) => {
        if (messageId !== "_reset") {
          return
        }
        if (data.type === "end") {
          resolve(true)
        } else if (data.type === "err") {
          console.warn("Scriptor: worker reset failed", data.msg)
          resolve(false)
        }
      }
      const onPoolError = (_instanceId, error) => {
        console.warn("Scriptor: parked worker died", error)
        // Keyed by handle so a late-arriving error doesn't hit a successor
        // parked in the meantime.
        clearParkedWorker(handle)
        resolve(false)
      }

      if (!rebindInstanceWorker(handle, null, onPoolMessage, onPoolError)) {
        resolve(false)
        return
      }

      handle.post({ id: "_reset", python: "" })
    })
  }

  // Hard-terminates the worker and removes the instance. No waiting for a
  // clean Python exit — worker state is transient, nothing to preserve.
  // exitScript() handles "cancel, window stays open" instead.
  function destroyInstance(instanceId) {
    const instance = state.instances[instanceId]
    if (!instance) {
      return
    }
    for (const [actionId, callback] of instance.pendingActions.entries()) {
      callback({ results: null, error: "instance_destroyed" })
      instance.pendingActions.delete(actionId)
    }

    const handle = instance.worker
    instance.worker = null

    // Only a fully loaded environment is worth parking. A failed or
    // still-loading worker is terminated as before.
    if (handle && instance.envState === "ready") {
      const version = instance.envVersion
      parkWorker({ handle: handle, resetPromise: resetWorker(handle), version: version })
      if (import.meta.env.DEV) {
        console.log(`[scriptor] ${instanceId}: worker parked`, { version: version })
      }
    } else {
      handle?.terminate()
    }

    // Drop any in-flight env load too, otherwise the map keeps an entry for
    // an instance that no longer exists.
    envLoads.delete(instanceId)
    delete state.instances[instanceId]
    stopBufferFlusherIfIdle()
  }

  // One interval for all instances. Previously each createWebWorker() call
  // started another one that was never stopped.
  let bufferFlusher = null

  function startBufferFlusher() {
    if (bufferFlusher !== null) {
      return
    }
    bufferFlusher = window.setInterval(() => {
      for (const instance of Object.values(state.instances)) {
        if (instance.messageBuffer.length) {
          instance.messages = instance.messages.concat([...instance.messageBuffer])
          instance.messageBuffer = []
        }
      }
    }, 50)
  }

  function stopBufferFlusherIfIdle() {
    if (bufferFlusher !== null && !Object.keys(state.instances).length) {
      window.clearInterval(bufferFlusher)
      bufferFlusher = null
    }
  }

  // Package list for the cold start. Dev mode uses a direct wheel URL,
  // otherwise the PyPI name with an optional version.
  function buildPackageList() {
    const packages = [...state.packages]
    if (import.meta.env.DEV && import.meta.env.VITE_SCRIPTOR_URL) {
      packages.unshift(import.meta.env.VITE_SCRIPTOR_URL)
    } else if (state.scriptorVersion === "latest") {
      packages.unshift("viur-scriptor-api")
    } else {
      packages.unshift(`viur-scriptor-api${state.scriptorVersion}`)
    }
    return packages
  }

  // The importable ZIP is identical for every worker. Fetch once per session
  // and pass the ArrayBuffer on — postMessage clones rather than transfers
  // it, so it stays reusable.
  async function getImportable() {
    if (env.importableLoaded) {
      return env.importable
    }
    try {
      const response = await Request.get("/vi/script/get_importable")
      if (response.status === 200) {
        env.importable = await response.arrayBuffer()
      }
    } catch (error) {
      // No importable present — not an error.
    }
    env.importableLoaded = true
    return env.importable
  }

  // Sends the installer job to the instance's worker and waits for it to
  // finish. envCache === null forces the cold-start path.
  function postEnvInstall(instanceId, envCache) {
    const instance = state.instances[instanceId]
    if (!instance?.worker) {
      return Promise.resolve({ results: null, error: "no_worker" })
    }
    return new Promise((resolve) => {
      instance.pendingActions.set("_pyinstaller", resolve)
      instance.worker.post({
        id: "_pyinstaller",
        python: "",
        pyoPackages: [...state.pyoPackages],
        packages: buildPackageList(),
        initCode: `with open("config.py", "w") as f:\n\tf.write("BASE_URL='${state.apiUrl}'")` + state.initCode,
        transformCode: "",
        importable: env.importable,
        envCache: envCache || undefined,
      })
    })
  }

  // Releases a lock only if it's still the current one. A second cold start
  // after timeout creates its own lock, which the first must not clear when
  // it finishes. Safe to call multiple times.
  function finishLoadingLock(lock, entry) {
    if (!lock || env.loadingLock !== lock) {
      return
    }
    const release = env.releaseLoadingLock
    env.loadingLock = null
    env.releaseLoadingLock = null
    release?.(entry)
  }

  async function load(instanceId) {
    const instance = state.instances[instanceId]
    if (!instance) {
      return false
    }
    const version = cacheVersion()
    const startedAt = performance.now()
    await getImportable()

    let cached = await readEnvCache(version)

    // If the user starts two scripts at once with an empty cache, the second
    // waits for the first one's lockfile instead of installing twice. After
    // COLD_START_WAIT_MS it resolves on its own so a stuck first worker can't
    // block it.
    if (!cached && env.loadingLock) {
      cached = await Promise.race([
        env.loadingLock,
        new Promise((resolve) => window.setTimeout(() => resolve(null), COLD_START_WAIT_MS)),
      ])
    }

    let myLock = null
    if (!cached) {
      let release = null
      myLock = new Promise((resolve) => {
        release = resolve
      })
      env.loadingLock = myLock
      env.releaseLoadingLock = release
    }

    if (import.meta.env.DEV) {
      console.log(
        `[scriptor] ${instanceId}: ${cached ? "WARM START — lockfile from cache" : "COLD START — no cache entry"}`,
        cached ? { packages: cached.installed?.length } : {}
      )
    }

    let result = await postEnvInstall(instanceId, cached)

    if (result?.error && cached) {
      // Stale or corrupt lockfile: drop the entry and fall back to a cold
      // start exactly once. Without this, a broken cache would permanently
      // block Scriptor.
      console.warn("Scriptor: warm start failed, falling back to cold start", result.error)
      await dropEnvCache(version)
      result = await postEnvInstall(instanceId, null)
    }

    // On success the envlock case already released any waiters once the
    // cache entry was actually written. This call is then a no-op, covering
    // only the case where no envlock arrived at all — i.e. a failed cold start.
    finishLoadingLock(myLock, null)

    if (!result?.error) {
      instance.envVersion = version
    }

    if (import.meta.env.DEV) {
      console.log(
        `[scriptor] ${instanceId}: environment ready after ${Math.round(performance.now() - startedAt)} ms` +
          (result?.error ? ` — error: ${result.error}` : "")
      )
    }

    return !result?.error
  }

  async function setParams(instanceId, scriptParams = {}) {
    const instance = state.instances[instanceId]
    if (!instance?.worker) {
      return
    }
    const contextStore = useContextStore()
    const urlData = (window.location.hash || "").replace(/^#/, "").split("_")
    const tabId = urlData[urlData.length - 1].replace("=", "")
    let selectedEntries = contextStore.getLocalContext(tabId, true)["_selectedEntries"]
    if (!selectedEntries && !scriptParams) {
      return
    }
    if (!scriptParams) {
      scriptParams = {}
    }
    selectedEntries = selectedEntries ? { __selected_entries: selectedEntries } : {}
    const params = Object.assign(selectedEntries, scriptParams)
    params["__is_dev__"] = import.meta.env.DEV

    return new Promise((resolve) => {
      instance.pendingActions.set("setParams", resolve)
      instance.worker.post({
        id: "setParams",
        python: "",
        params: JSON.parse(JSON.stringify(params)),
      })
    })
  }

  async function sendResult(instanceId, type, data) {
    const instance = state.instances[instanceId]
    if (!instance?.worker) {
      return
    }
    // post() rather than worker.postMessage(): useWebWorker's post() unwraps
    // the shallowRef itself and checks a worker exists. Old code accessed
    // state.workerObject.worker.postMessage, which only worked because
    // reactive() unwrapped the ref.
    instance.worker.post({
      id: "_sendDialogSignal",
      type: type,
      data: data,
    })
  }

  // Aborts the running script but leaves the worker in place — the window
  // stays usable. destroyInstance() handles "close window" instead.
  async function exitScript(instanceId) {
    await sendResult(instanceId, "exit", "__exit__")
  }

  async function execute(code, id = null, context = {}, scriptParams = {}) {
    const currentId = createNewInstance(id)
    const instance = state.instances[currentId]
    instance.messages = []
    instance.messageBuffer = []
    instance.internalMessages = []

    if (instance.envState !== "ready") {
      // A second click during loading must wait on the same load. Without
      // this guard, a second postEnvInstall() call would overwrite the
      // first's "_pyinstaller" callback and its execute() promise would never
      // resolve. The old code guarded this with a global isLoading flag.
      let envLoad = envLoads.get(currentId)
      if (!envLoad) {
        if (!(await acquireWorker(currentId))) {
          return { results: null, error: "worker_limit" }
        }
        // Adopted worker: the environment is already up, load() is skipped.
        if (instance.envState !== "ready") {
          instance.envState = "loading"
          envLoad = load(currentId).finally(() => envLoads.delete(currentId))
          envLoads.set(currentId, envLoad)
        }
      }
      if (envLoad) {
        const ok = await envLoad
        if (!ok) {
          instance.envState = "failed"
          return { results: null, error: "env_failed" }
        }
        instance.envState = "ready"
      }
    }

    if (code === undefined) {
      console.log("Nothing to execute")
      code = ""
    }
    await setParams(currentId, scriptParams)
    code = `${code}\nimport viur.scriptor\nimport traceback\nawait viur.scriptor._init_modules()\nfrom viur.scriptor import *\n\ntry:\n    await main()\nexcept:\n    logger.error(traceback.format_exc())\n`

    instance.runState = "running"
    return new Promise((resolve) => {
      instance.pendingActions.set(currentId, resolve)
      instance.worker.post({ id: currentId, python: code, ...context })
    })
  }

  function handleCallback(instanceId, messageId, data) {
    const instance = state.instances[instanceId]
    const callback = instance?.pendingActions.get(messageId)
    if (callback) {
      callback({ results: data.res ?? null, error: data.msg ?? null })
      instance.pendingActions.delete(messageId)
    }
  }

  function preload(instanceId = null) {
    return execute(undefined, instanceId)
  }

  function addMessageEntry(type, id, data) {
    let currentState = state.instances[id]
    data["unique_id"] = new Date().getTime().toString()
    currentState.messageBuffer.push({ type: type, data: data })
  }

  // Marks a message as answered. State lives on the message in the store,
  // not in the widget's local state, on purpose: restoring from minimized
  // rebuilds all widgets in WidgetList.vue, so local state would start
  // unanswered again. A long-answered question would then be indistinguishable
  // from the current one, and clicking it would call sendResult() again and
  // overwrite the worker's single global resultValue slot while the script
  // waits on a different question's answer.
  function markMessageAnswered(instanceId, uniqueId) {
    const instance = state.instances[instanceId]
    const entry = instance?.messages.find((message) => message.data.unique_id === uniqueId)
    if (entry) {
      entry.data.answered = true
    }
  }

  function addInternalMessageEntry(type, id, data) {
    let currentState = state.instances[id]
    data["unique_id"] = new Date().getTime().toString()
    // currentState.internalMessages.push({type:type, data:data})
  }

  function normalizeText(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/\ /g, "&nbsp;")
      .replace(/\n/g, "<br />")
  }

  // Cache key must include the version, otherwise switching versions keeps
  // serving the old environment.
  function cacheVersion() {
    return state.scriptorVersion || "latest"
  }

  async function handleMessage(instanceId, messageId, data) {
    const instance = state.instances[instanceId]
    if (!instance) {
      return
    }

    switch (data.type) {
      case "installlog":
        if (import.meta.env.DEV) {
          console.log(`[scriptor] ${instanceId} stage ${data["msg"]["stage"]}: ${data["msg"]["msg"]}`)
        }
        addInternalMessageEntry("install", instanceId, data)
        instance.envState = data["msg"]["stage"] === 5 ? "ready" : "loading"
        break
      case "envlock": {
        const version = cacheVersion()
        const written = await writeEnvCache(version, data["lock"], data["installed"])
        if (import.meta.env.DEV) {
          console.log(`[scriptor] ${instanceId}: envlock received — written to cache: ${written}`, {
            packages: data["installed"]?.length,
          })
        }
        // Only released here: onmessage delivery doesn't wait for this
        // handler, otherwise run_end could beat the cache write.
        finishLoadingLock(env.loadingLock, await readEnvCache(version))
        break
      }
      case "stdout":
        addInternalMessageEntry("install", instanceId, data)
        break
      // Only the script run itself ends the run. The worker also sends "end"
      // for every dialog signal (webworker.js:325) and FS operation; setting
      // runState to "done" there would mark a script done after its first
      // dialog answer. run_end is sent from exactly two places
      // (webworker.js:191 for the run, :224 for the installer); the script's
      // message carries the instance ID as messageId.
      case "run_end":
        if (messageId === instanceId && instance.runState === "running") {
          instance.runState = "done"
        }
        handleCallback(instanceId, messageId, data)
        break
      case "end":
        handleCallback(instanceId, messageId, data)
        break
      case "err":
        addMessageEntry("error", instanceId, data)
        // An installer error is not a failed run — envState carries that.
        // Otherwise the instance would report an error for a script that
        // never started.
        if (messageId === instanceId) {
          instance.runState = "error"
        }
        handleCallback(instanceId, messageId, data)
        break
      case "log":
        data.msg = normalizeText(data.text)
        addMessageEntry(data.level, instanceId, data)
        break
      case "alert":
        data.msg = normalizeText(data.text)
        addMessageEntry(data.type, instanceId, data)
        break
      case "download": {
        const a = document.createElement("a")
        a.href = window.URL.createObjectURL(data.blob)
        a.download = data.filename
        a.click()
        break
      }
      case "showOpenFilePicker": {
        let openhandle = -1
        const types = data.types || []
        try {
          openhandle = await window.showOpenFilePicker({ multiple: false, types: types })
        } catch (e) {}
        await sendResult(instanceId, "showOpenFilePickerResult", openhandle)
        break
      }
      case "showSaveFilePicker": {
        let savehandle = -1
        try {
          savehandle = await window.showSaveFilePicker()
        } catch (e) {}
        await sendResult(instanceId, "showSaveFilePickerResult", savehandle)
        break
      }
      case "showDirectoryPicker": {
        let dirhandle = -1
        try {
          dirhandle = await window.showDirectoryPicker({ mode: "readwrite" })
        } catch (e) {
          console.error("Failed to open the FilePicker", e)
        }
        await sendResult(instanceId, "showDirectoryPickerResult", dirhandle)
        break
      }
      case "progressbar":
        setProgress(instanceId, data.total, data.step, data.max_step, data.txt)
        break
      case "multiple-dialog":
        data["components"] = JSON.parse(data["components"])
        addMessageEntry(data.type, instanceId, data)
        break
      case "clear":
        instance.messages.length = data["length"]
        break
      case "system-message": {
        const messageStore = useMessageStore()
        messageStore.addMessage(data["_type"], data["title"], data["text"])
        break
      }
      default:
        if (["select", "input", "diffcmp", "table", "stdout", "stderr", "raw_html"].includes(data.type)) {
          addMessageEntry(data.type, instanceId, data)
          break
        } else {
          throw new Error(`Unknown event type ${data.type}`)
        }
    }
  }

  function fetchScriptorVersions() {
    async function get() {
      try {
        const response = await fetch(`https://pypi.org/pypi/viur-scriptor-api/json`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        const versions = Object.keys(data.releases)
        versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
        return versions.filter((x) => x.startsWith("1."))
      } catch (error) {
        console.error("Error fetching data:", error)
        return []
      }
    }

    return get()
  }

  return {
    state,
    execute,
    exitScript,
    sendResult,
    createNewInstance,
    destroyInstance,
    fetchScriptorVersions,
    preload,
    markMessageAnswered,
  }
})
