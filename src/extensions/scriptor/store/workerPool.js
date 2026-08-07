// Parkplatz für genau einen warmen Scriptor-Worker.
//
// Beim Schließen eines Fensters wird der Worker nicht mehr terminiert, sondern
// hier abgelegt; das nächste Fenster übernimmt ihn samt geladener
// Pyodide-Umgebung. Genau einer, weil das dem Speicherverhalten vor der
// Umstellung auf parallele Skripte entspricht — dort lebte ebenfalls ein
// einzelner Worker über die ganze Sitzung. Pyodide belegt grob 150–300 MB.
//
// Bewusst frei von Pinia und Vue, damit sich die Funktionen einzeln in der
// Browser-Konsole prüfen lassen — genau wie envCache.js.

let parked = null

// Legt einen Worker ab. Ein bereits geparkter wird dabei terminiert: mehr als
// einer soll nie im Speicher stehen.
export function parkWorker(entry) {
  if (parked) {
    parked.handle?.terminate()
  }
  parked = entry
}

// Nimmt den geparkten Worker heraus und leert den Parkplatz. Der Aufrufer ist
// ab hier für terminate() zuständig, falls er ihn doch nicht übernimmt.
export function takeParkedWorker() {
  const entry = parked
  parked = null
  return entry
}

export function hasParkedWorker() {
  return Boolean(parked)
}

// Terminiert den geparkten Worker, etwa wenn er auf dem Parkplatz gestorben ist.
//
// Mit handle wird nur geleert, wenn genau dieser Worker noch liegt. Ohne diese
// Prüfung könnte ein spät eintreffender Fehler eines längst entnommenen Workers
// den inzwischen geparkten Nachfolger terminieren.
export function clearParkedWorker(handle = null) {
  if (handle && parked?.handle !== handle) {
    return
  }
  parked?.handle?.terminate()
  parked = null
}
