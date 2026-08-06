// Übersetzt den Zustand einer Scriptor-Instanz in die Anzeige des Badges.
// Gemeinsam genutzt von Status.vue und StatusBar.vue, damit Badge und
// Statusleiste nie unterschiedliche Texte für denselben Zustand zeigen.
export function describeInstanceStatus(instance) {
  if (!instance) {
    return { text: "Skriptor nicht geladen.", variant: "danger", pulse: false }
  }
  if (instance.envState === "failed") {
    return { text: "Skriptor-Fehler.", variant: "danger", pulse: false }
  }
  if (instance.envState === "loading") {
    return { text: "Skriptor wird geladen...", variant: "warning", pulse: true }
  }
  if (instance.envState !== "ready") {
    return { text: "Skriptor nicht geladen.", variant: "danger", pulse: false }
  }
  if (instance.runState === "running") {
    return { text: "Skript läuft...", variant: "success", pulse: true }
  }
  return { text: "Skriptor ist bereit.", variant: "success", pulse: false }
}
