// Cache Storage for Scriptor's frozen Pyodide environment.
//
// The first worker has micropip resolve packages against PyPI; the result is
// stored here as pyodide-lock.json (micropip.freeze()). Further workers start
// from that via loadPyodide({lockFileContents, packages}) and skip resolution.
//
// Deliberately free of Pinia and Vue so the functions can be checked
// individually in the browser console.

const CACHE_NAME = "scriptor-env-v1"

// Cache Storage requires a request URL as key. The host part is a pure
// placeholder and is never actually requested.
export function envCacheVersionKey(scriptorVersion) {
  return `https://scriptor-env.local/lock-${encodeURIComponent(scriptorVersion || "latest")}`
}

// In dev mode VITE_SCRIPTOR_URL points at a locally built wheel that changes
// with every build. A cache there would serve stale packages.
export function isEnvCacheDisabled() {
  return Boolean(import.meta.env.VITE_SCRIPTOR_URL) || !("caches" in globalThis)
}

// A lockfile with relative file_name entries is unusable for us: with
// lockFileContents set, loadPyodide then also requires an explicit
// packageBaseUrl, or the warm start fails silently. micropip.freeze() returns
// absolute URLs — checked here rather than trusted.
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
