// Translates a Scriptor instance's state into the badge display. Shared by
// Status.vue and StatusBar.vue so badge and status bar never show different
// text for the same state.
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
  // A run that fails in the script itself leaves envState at "ready" — without
  // this branch a failed script would show the same green "ready" badge as one
  // that completed cleanly.
  if (instance.runState === "error") {
    return { text: "Skript mit Fehler beendet.", variant: "danger", pulse: false }
  }
  return { text: "Skriptor ist bereit.", variant: "success", pulse: false }
}
