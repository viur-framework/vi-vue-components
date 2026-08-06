# Scriptor 3.0.0 — Migration

Der Scriptor führt mehrere Skripte gleichzeitig aus. Jede Scriptor-Instanz hat
ihren eigenen WebWorker; der Store hat deshalb keinen globalen Ausführungszustand
mehr. Höchstens drei Worker laufen parallel, ein weiterer Start wird mit einer
Meldung abgelehnt.

## Entfernte API

| Entfernt | Ersatz |
|---|---|
| `state.workerObject` | `state.instances[id].worker` |
| `state.isReady` | `state.instances[id].envState === "ready"` |
| `state.isLoading` | `state.instances[id].envState === "loading"` |
| `state.isRunning` | `state.instances[id].runState === "running"` |
| `state.currentInstance` | entfällt — Nachrichten sind über eine Closure an die Instanz gebunden |
| `state.runningActions` | `state.instances[id].pendingActions` |
| `store.progress` | `state.instances[id].progress` |

Die `state.isRunning`-Zeile ist keine reine 1:1-Entsprechung: Der alte Shim war
*zusätzlich* wahr, solange `envState === "loading"` war, weil das den
Ausführen-Button während der mehrere Sekunden dauernden Installation sperrte.
Für genau diese kombinierte "Instanz ist beschäftigt"-Prüfung liefert
`describeInstanceStatus()` (`store/instanceStatus.js`) das `pulse`-Flag, das
`runState === "running"` und `envState === "loading"` bereits ODER-verknüpft —
wer beide Fälle abdecken will, prüft `pulse`, nicht nur `runState`.

## Geänderte Signaturen

| Vorher | Nachher |
|---|---|
| `sendResult(type, data)` | `sendResult(instanceId, type, data)` |
| `exitScript()` | `exitScript(instanceId)` |
| `preload()` | `preload(instanceId)` |

`execute(code, id, context, scriptParams)` bleibt unverändert, resolvt aber jetzt
mit `{results, error}`. Bei einem fehlgeschlagenen Lauf ist `error` entweder
einer der festen Codes `worker_limit`, `env_failed`, `worker_error` oder
`instance_destroyed`, oder eine Freitext-Fehlermeldung, die der Worker aus einer
JS-/Python-Exception weiterreicht (der reguläre Weg, wie ein Skriptfehler den
Aufrufer erreicht). `no_worker` taucht hier **nicht** auf: dieser Code wird nur
intern von `postEnvInstall()` an `load()` zurückgegeben, das ihn in `env_failed`
übersetzt, bevor `execute()` zurückkehrt.

## Neu

- `destroyInstance(instanceId)` — terminiert den Worker und entfernt die Instanz.
  **Muss** aufgerufen werden, wenn ein Scriptor-Fenster geschlossen wird, sonst
  bleibt der Worker samt Pyodide-Speicher am Leben.
- `exitScript(instanceId)` bricht nur das Skript ab und lässt den Worker stehen.

## Zustandsfelder pro Instanz

`envState`: `cold` | `loading` | `ready` | `failed`
`runState`: `idle` | `running` | `done` | `error`

## Env-Cache

Die aufgelöste Python-Umgebung wird als Lockfile (`micropip.freeze()`) in der
Cache Storage unter `scriptor-env-v1` abgelegt und für weitere Worker über
`loadPyodide({lockFileContents, packages})` wiederverwendet.
`isEnvCacheDisabled()` schaltet den Cache in zwei Fällen ab: bei gesetztem
`VITE_SCRIPTOR_URL`, weil sich ein lokal gebautes Wheel bei jedem Build
ändert, und wenn keine Cache Storage API existiert
(`!("caches" in globalThis)`, z. B. in manchen privaten Browser-Modi) — dort
gibt es ohnehin nichts zu cachen.
