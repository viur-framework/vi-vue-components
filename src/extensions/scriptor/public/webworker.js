importScripts("https://cdn.jsdelivr.net/pyodide/v0.28.1/full/pyodide.js")

let isPyLoaded = false

// Pfade, die Skripte über _write angelegt haben. Beim Recyceln eines Workers
// müssen genau diese wieder verschwinden — das übrige Dateisystem enthält das
// entpackte importable und die config.py, die zur Umgebung gehören.
self.writtenPaths = new Set()

function stdout(msg) {
  self.postMessage({ type: "stdout", msg: msg, id: null })
}

function stderr(msg) {
  self.postMessage({ type: "stderr", msg: msg, id: null })
}

function installLog(id, stage, msg) {
  self.postMessage({
    type: "installlog",
    msg: {
      stage: stage,
      msg: msg,
    },
    id: id,
  })
}

function err(id, msg) {
  self.postMessage({ type: "err", msg: msg, id: id })
}

function end(id, res) {
  self.postMessage({ type: "end", res: res ?? null, id: id })
}

function run_end(id, res) {
  self.postMessage({ type: "run_end", res: res ?? null, id: id })
}

let manager = {
  allocId: 0,
  currentProcessId: 0,
  tasks: {},
  params: {},
  language: "en",
  resultValue: null,
  copyResult: function () {
    return structuredClone(this.resultValue)
  },

  reset: function () {
    this.resultValue = undefined
  },

  intervalEvent: null,
  sleep: async function sleep(time) {
    return new Promise((resolve, _) => setTimeout(resolve, time))
  },
}

// Namen der tatsächlich geladenen Pakete. micropip trägt jedes installierte
// Wheel per setattr(loadedPackages, project_name, source) ein (wheelinfo.py),
// pyodide.loadPackage ebenso. Damit ist das die minimale Liste, die ein warmer
// Start braucht — im Gegensatz zu micropip.list(), das laut eigenem Kommentar
// auch alle stdlib-Distributionen mitzählt.
function loadedPackageNames() {
  try {
    return Object.keys(self.pyodide.loadedPackages)
  } catch (error) {
    console.warn("Scriptor: could not read loadedPackages", error)
    return []
  }
}

// Nach einem Kaltstart das aufgelöste Lockfile an den Store schicken, damit er es
// in die Cache Storage legt. Fehler hier dürfen den Start nicht abbrechen: ohne
// Cache ist der Scriptor langsamer, aber funktionsfähig.
async function sendEnvLock(id) {
  try {
    const lock = await self.pyodide.runPythonAsync(`
import micropip
micropip.freeze()`)
    self.postMessage({
      type: "envlock",
      lock: lock,
      installed: loadedPackageNames(),
      id: null,
    })
  } catch (error) {
    console.warn("Scriptor: could not freeze python env", error)
  }
}

async function loadPyodideAndPackages(id, pyoPackages, packages, initCode, transformCode, importable, envCache) {
  const warmStart = Boolean(envCache?.lock && envCache?.installed?.length)

  installLog(id, 1, "Loading python runtime")

  if (warmStart) {
    // Das gefreezte Lockfile beschreibt alle Pakete inklusive der per micropip
    // nachinstallierten. Die packages-Option lädt sie während des
    // WASM-Bootstraps — ohne PyPI-Abfrage und ohne Dependency-Auflösung.
    self.pyodide = await loadPyodide({
      convertNullToNone: true,
      stdout: stdout,
      stderr: stderr,
      lockFileContents: envCache.lock,
      packages: envCache.installed,
    })
    installLog(id, 3, `Restoring python packages from cache`)
  } else {
    self.pyodide = await loadPyodide({
      convertNullToNone: true,
      stdout: stdout,
      stderr: stderr,
    })
    pyoPackages.unshift("micropip")
    installLog(id, 2, `Creating python env`)
    await self.pyodide.loadPackage(pyoPackages)
    installLog(id, 3, `Installing python packages`)
    self.parray = packages

    await self.pyodide.runPythonAsync(`
  import micropip
  from js import parray
  await micropip.install(parray.to_py())
  `)

    self.parray = undefined
    await sendEnvLock(id)
  }

  installLog(id, 4, `Initializing environment`)
  if (importable !== undefined) {
    await self.pyodide.unpackArchive(importable, "zip")
    self.pyodide.pyimport("importable")
  }

  const src = `from pyodide.code import eval_code_async
from pyodide.ffi import to_js
from js import console
import sys
import asyncio

_current_task = None

async def scriptor_reset():
  global _current_task
  task = _current_task
  _current_task = None
  if task is not None and not task.done():
    task.cancel()
    try:
      await task
    except BaseException:
      pass

async def pyeval(code, ns):
  global _current_task
  _current_task = asyncio.current_task()
  names = []
  for name in sys.modules.keys():
  	if name.startswith("importable.") or name == "importable":
  		names.append(name)
  for name in names:
  	del sys.modules[name]
  if not "/" in sys.path:
  	sys.path.append("/")
  result = await eval_code_async(code, ns)
  ${transformCode}

  return to_js(result)`
  await self.pyodide.registerJsModule("manager", manager)
  await self.pyodide.runPythonAsync(src)
  if (initCode.length > 0) {
    await self.pyodide.runPythonAsync(initCode)
  }

  installLog(id, 5, "The python env is loaded")
  isPyLoaded = true
}

async function runScript(python, id) {
  try {
    //console.log("Load imports")
    await self.pyodide.loadPackagesFromImports(python)
    let empty_dict = await self.pyodide.runPythonAsync("{}")
    //let results = await self.pyodide.globals.get("pyeval")(python, empty_dict)
    //empty_dict.destroy();

    manager.currentProcessId = ++manager.allocId
    manager.tasks[manager.currentProcessId] = {
      promise: self.pyodide.globals.get("pyeval")(python, empty_dict),
      dict: empty_dict,
      done: false,
    }

    let processId = manager.currentProcessId

    manager.tasks[processId]["promise"]
      .then(() => {
        // Ein zwischenzeitliches _reset leert manager.tasks bereits, bevor
        // dieser Handler drankommt — der Eintrag kann hier also fehlen.
        // empty_dict ist lokal gehalten, damit der PyProxy trotzdem freigegeben wird.
        const task = manager.tasks[processId]
        if (task) {
          task["done"] = true
          delete manager.tasks[processId]
        }
        empty_dict.destroy()
        run_end(id)
      })
      .catch((error) => {
        // Siehe Kommentar im .then()-Zweig: der Eintrag kann durch ein
        // zwischenzeitliches _reset bereits entfernt worden sein.
        const task = manager.tasks[processId]
        if (task) {
          task["done"] = true
          delete manager.tasks[processId]
        }
        console.log("PY RUN ERR", error)
        empty_dict.destroy()

        err(id, error.message)
      })
  } catch (error) {
    console.log("PY RUN ERR", error)
    err(id, error.message)
  }
}
self.onmessageerror = (e) => {
  console.error(e)
}
self.onmessage = async (event) => {
  const { id, python, ...context } = event.data
  if (id === "_pyinstaller") {
    // Ohne dieses try/catch bleibt die _pyinstaller-Promise im Store bei einem
    // Fehler für immer offen und der Scriptor hängt im Ladezustand.
    try {
      await loadPyodideAndPackages(
        id,
        context.pyoPackages,
        context.packages,
        context.initCode,
        context.transformCode,
        context.importable,
        context.envCache
      )
      run_end(id)
    } catch (error) {
      console.log("PY ENV ERR", error)
      err(id, error?.message || String(error))
    }
  } else if (id === "_reset") {
    // Setzt den Worker so weit zurück, dass ihn ein anderes Fenster übernehmen
    // kann. Die Bestätigung kommt bewusst erst am Ende: postMessage ist pro
    // Worker FIFO, also sind alle Nachrichten des abgebrochenen Laufs — auch
    // das err aus dem CancelledError — vorher zugestellt.
    try {
      if (isPyLoaded) {
        await self.pyodide.runPythonAsync("await scriptor_reset()")
        for (const path of self.writtenPaths) {
          try {
            if (self.pyodide.FS.analyzePath(path).exists) {
              self.pyodide.FS.unlink(path)
            }
          } catch (error) {
            console.warn("Scriptor: could not remove", path, error)
          }
        }
      }
      self.writtenPaths.clear()
      manager.tasks = {}
      manager.currentProcessId = 0
      manager.reset()
      end(id)
    } catch (error) {
      console.log("PY RESET ERR", error)
      err(id, error?.message || String(error))
    }
  } else if (id === "_write") {
    if (context === undefined) return

    let _path = context.path.substring(1)
    let _dirs = _path.split("/")
    let value = {}

    let _tmp_path = "/"
    for (let i in _dirs) {
      let _dir = _dirs[i]
      _tmp_path += _dir + "/"
      value = self.pyodide.FS.analyzePath(_tmp_path)
      _tmp_path.replaceAll("//", "/")

      if (!value.exists) {
        self.pyodide.FS.mkdir(_tmp_path)
      }
    }

    value = self.pyodide.FS.analyzePath(context.path)
    if (!value.exists) {
      self.pyodide.FS.mkdir(context.path)
    }

    let file_path = context.path + context.name
    file_path.replaceAll("//", "/")

    value = self.pyodide.FS.analyzePath(file_path)
    if (value.exists) {
      self.pyodide.FS.unlink(file_path)
      //self.pyodide.FS.ftruncate(file_path, 0);
    }

    self.pyodide.FS.writeFile(file_path, python, { encoding: "utf-8" })
    self.writtenPaths.add(file_path)
    end(id)
  } else if (id === "_removeFile") {
    let value = self.pyodide.FS.analyzePath(context.path)
    if (!value.exists) {
      end(id)
      return
    }

    let file_path = context.path + context.name
    file_path.replaceAll("//", "/")

    value = self.pyodide.FS.analyzePath(file_path)
    if (value.exists) {
      self.pyodide.FS.unlink(file_path)
      self.writtenPaths.delete(file_path)
    }

    end(id)
  } else if (id === "_removeDir") {
    let value = self.pyodide.FS.analyzePath(context.path)
    if (value.exists) {
      self.pyodide.FS.rmdir(context.path)
    }
    end(id)
  } else if (id === "_renameFile") {
    let value = self.pyodide.FS.analyzePath(context.srcPath)
    if (!value.exists) {
      end(id)
      return
    }

    let srcPath = context.srcPath + context.srcName
    srcPath.replaceAll("//", "/")

    value = self.pyodide.FS.analyzePath(context.dstPath)
    if (!value.exists) {
      self.pyodide.FS.mkdir(context.dstPath)
    }

    let dstPath = context.dstPath + context.dstName
    dstPath.replaceAll("//", "/")

    self.pyodide.FS.rename(srcPath, dstPath)

    end(id)
  } else if (id === "_renameDir") {
    let value = self.pyodide.FS.analyzePath(context.srcPath)
    if (!value.exists) {
      end(id)
      return
    }

    self.pyodide.FS.rename(context.srcPath, context.dstPath)

    end(id)
  } else if (id === "_setDirectoryHandle") {
    manager.resultValue = context.handle
  } else if (id === "_setFileHandle") {
    manager.resultValue = context.handle
  } else if (id === "_setOpenFilePickerHandle") {
    manager.resultValue = context.handle
  } else if (id === "_sendDialogSignal") {
    manager.resultValue = context.data
    end(id)
  } else if (id === "setParams") {
    manager.params = context.params
    end(id)
  } else if (id === "setLanguage") {
    manager.language = context.language
    end(id)
  } else {
    // The worker copies the context in its own "memory" (an object mapping name to values)
    for (const key of Object.keys(context)) {
      //if (key === "showSaveFilePicker" || key === "showDirectoryPicker")
      //	continue;
      self[key] = context[key]
    }
    if (!isPyLoaded) {
      //await loadPyodideAndPackages(id, []);
      throw new Error("Python is not loaded")
    }

    manager.resultValue = null

    await self.pyodide.registerJsModule("manager", manager)

    //end(id);
    await runScript(python, id)
  }
}
