// Cache Storage für die gefreezte Pyodide-Umgebung des Scriptors.
//
// Beim ersten Worker löst micropip die Pakete gegen PyPI auf; das Ergebnis wird
// als pyodide-lock.json (micropip.freeze()) hier abgelegt. Weitere Worker
// starten damit über loadPyodide({lockFileContents, packages}) und brauchen
// keine Abfrage mehr.
//
// Bewusst frei von Pinia und Vue, damit die Funktionen einzeln in der
// Browser-Konsole geprüft werden können.

const CACHE_NAME = "scriptor-env-v1"

// Cache Storage verlangt eine Request-URL als Schlüssel. Die Host-Angabe ist ein
// reiner Platzhalter und wird nie angefragt.
export function envCacheVersionKey(scriptorVersion) {
  return `https://scriptor-env.local/lock-${encodeURIComponent(scriptorVersion || "latest")}`
}

// Im Dev-Modus zeigt VITE_SCRIPTOR_URL auf ein lokal gebautes Wheel, das sich bei
// jedem Build ändert. Ein Cache würde dort veraltete Pakete ausliefern.
export function isEnvCacheDisabled() {
  return Boolean(import.meta.env.VITE_SCRIPTOR_URL) || !("caches" in globalThis)
}

// Ein Lockfile mit relativen file_name-Einträgen ist für uns unbrauchbar: bei
// gesetztem lockFileContents verlangt loadPyodide dann zusätzlich ein explizites
// packageBaseUrl, sonst bricht der warme Start stumm. micropip.freeze() liefert
// absolute URLs — wir prüfen es trotzdem, statt darauf zu vertrauen.
export function hasOnlyAbsoluteUrls(lock) {
  const packages = lock?.packages
  if (!packages || typeof packages !== "object") {
    return false
  }
  const entries = Object.values(packages)
  if (!entries.length) {
    return false
  }
  return entries.every((pkg) => /^https?:\/\//.test(pkg?.file_name || ""))
}

export async function readEnvCache(version) {
  if (isEnvCacheDisabled()) {
    return null
  }
  try {
    const cache = await caches.open(CACHE_NAME)
    const response = await cache.match(envCacheVersionKey(version))
    if (!response) {
      return null
    }
    const entry = await response.json()
    if (!entry?.lock || !Array.isArray(entry?.installed) || !entry.installed.length) {
      return null
    }
    if (!hasOnlyAbsoluteUrls(entry.lock)) {
      return null
    }
    return entry
  } catch (error) {
    console.warn("Scriptor: reading env cache failed", error)
    return null
  }
}

export async function writeEnvCache(version, lockJson, installed) {
  if (isEnvCacheDisabled()) {
    return false
  }
  if (!Array.isArray(installed) || !installed.length) {
    console.warn("Scriptor: refusing to cache env without package list")
    return false
  }
  let lock = null
  try {
    lock = JSON.parse(lockJson)
  } catch (error) {
    console.warn("Scriptor: micropip.freeze() returned invalid json", error)
    return false
  }
  if (!hasOnlyAbsoluteUrls(lock)) {
    console.warn("Scriptor: lockfile has relative file_name entries, not caching")
    return false
  }
  try {
    const cache = await caches.open(CACHE_NAME)
    const body = JSON.stringify({ lock: lock, installed: installed })
    await cache.put(
      envCacheVersionKey(version),
      new Response(body, { headers: { "Content-Type": "application/json" } })
    )
    return true
  } catch (error) {
    console.warn("Scriptor: writing env cache failed", error)
    return false
  }
}

export async function dropEnvCache(version) {
  if (!("caches" in globalThis)) {
    return
  }
  try {
    const cache = await caches.open(CACHE_NAME)
    await cache.delete(envCacheVersionKey(version))
  } catch (error) {
    console.warn("Scriptor: deleting env cache failed", error)
  }
}
