// Web worker that lints Python source with Ruff (WASM). It reports diagnostics
// back tagged with the request `version` so the main thread can discard stale
// results. Star-import false positives (F403/F405/F821) are ignored because the
// Scriptor namespace is injected via `from viur.scriptor import *`.
import init, { Workspace } from "@astral-sh/ruff-wasm-web"
import ruffWasmUrl from "@astral-sh/ruff-wasm-web/ruff_wasm_bg.wasm?url"

let workspacePromise = null

function getWorkspace() {
  if (!workspacePromise) {
    workspacePromise = init(ruffWasmUrl).then(() => new Workspace({ lint: { ignore: ["F403", "F405", "F821"] } }))
  }
  return workspacePromise
}

self.onmessage = async (event) => {
  const { version, code } = event.data
  let diagnostics = []
  try {
    const workspace = await getWorkspace()
    diagnostics = workspace.check(code)
  } catch (e) {
    // Best-effort linting: on any failure, report no diagnostics.
    diagnostics = []
  }
  self.postMessage({ version, diagnostics })
}
