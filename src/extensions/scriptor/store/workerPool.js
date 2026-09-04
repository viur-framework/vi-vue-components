// Parking slot for exactly one warm Scriptor worker.
//
// When a window closes, its worker is no longer terminated but parked here;
// the next window adopts it along with its loaded Pyodide environment. Only
// one slot, matching the memory footprint from before parallel scripts, where
// a single worker likewise lived for the whole session. Pyodide uses roughly
// 150-300 MB.
//
// Deliberately free of Pinia and Vue so the functions can be checked
// individually in the browser console — same as envCache.js.

let parked = null

// Parks a worker. An already-parked one is terminated first: never more than
// one in memory at a time.
export function parkWorker(entry) {
  if (parked) {
    parked.handle?.terminate()
  }
  parked = entry
}

// Takes the parked worker out and clears the slot. From here the caller is
// responsible for terminate() if it doesn't adopt the worker after all.
export function takeParkedWorker() {
  const entry = parked
  parked = null
  return entry
}

export function hasParkedWorker() {
  return Boolean(parked)
}

// Terminates the parked worker, e.g. if it died while parked.
//
// With a handle, it only clears if that exact worker is still parked.
// Without this check, a late error from a long-taken worker could terminate
// the successor parked in the meantime.
export function clearParkedWorker(handle = null) {
  if (handle && parked?.handle !== handle) {
    return
  }
  parked?.handle?.terminate()
  parked = null
}
