// Monaco completion provider for the Scriptor Python editor: the Scriptor API
// surface plus the ViUR module names available in this admin instance.

// Static Scriptor API completions. `insertText` may contain Monaco snippet
// placeholders ($1, $2); `kind` is a key resolved to
// monaco.languages.CompletionItemKind at registration time.
export const SCRIPTOR_API_ENTRIES = [
  {
    label: "modules.get_module",
    insertText: 'await modules.get_module("$1")',
    detail: "Modul laden (List/Tree/Singleton)",
    kind: "Function",
  },
  { label: "Dialog.print", insertText: 'Dialog.print("$1")', detail: "Ausgabe (kein await)", kind: "Method" },
  { label: "Dialog.alert", insertText: 'await Dialog.alert("$1")', detail: "Hinweis, wartet auf OK", kind: "Method" },
  {
    label: "Dialog.confirm",
    insertText: 'await Dialog.confirm("$1")',
    detail: "Ja/Nein-Abfrage -> bool",
    kind: "Method",
  },
  { label: "Dialog.text", insertText: 'await Dialog.text("$1")', detail: "Texteingabe", kind: "Method" },
  { label: "Dialog.number", insertText: 'await Dialog.number("$1")', detail: "Zahleneingabe", kind: "Method" },
  { label: "Dialog.date", insertText: 'await Dialog.date("$1")', detail: "Datumseingabe", kind: "Method" },
  { label: "Dialog.select", insertText: "await Dialog.select([$1])", detail: "Auswahl aus Liste", kind: "Method" },
  { label: "Dialog.table", insertText: "await Dialog.table([$1], [$2])", detail: "Tabelle anzeigen", kind: "Method" },
  { label: "File.from_string", insertText: 'File.from_string($1, "$2")', detail: "Datei aus String", kind: "Method" },
  { label: "File.from_bytes", insertText: 'File.from_bytes($1, "$2")', detail: "Datei aus Bytes", kind: "Method" },
  { label: "File.from_url", insertText: 'await File.from_url("$1")', detail: "Datei aus URL", kind: "Method" },
  { label: "File.open_dialog", insertText: "await File.open_dialog()", detail: "Datei-Auswahl-Dialog", kind: "Method" },
  {
    label: "Message.send",
    insertText: 'Message.send(type="$1", title="$2", text="$3")',
    detail: "Toast-Benachrichtigung",
    kind: "Method",
  },
  { label: "logger.info", insertText: 'logger.info("$1")', detail: "Info-Log", kind: "Method" },
  { label: "logger.error", insertText: 'logger.error("$1")', detail: "Fehler-Log", kind: "Method" },
  { label: "logger.debug", insertText: 'logger.debug("$1")', detail: "Debug-Log", kind: "Method" },
  {
    label: "ProgressBar.set",
    insertText: 'ProgressBar.set(percent=$1, current_step=$2, total_steps=$3, text="$4")',
    detail: "Fortschritt setzen",
    kind: "Method",
  },
  { label: "ProgressBar.unset", insertText: "ProgressBar.unset()", detail: "Fortschritt ausblenden", kind: "Method" },
  { label: "WebRequest.get", insertText: 'await WebRequest.get("$1")', detail: "HTTP GET", kind: "Method" },
]

// Build Monaco suggestion objects from the static API entries and the given
// module names, all sharing one insertion range. `kinds` maps our kind keys
// to monaco.languages.CompletionItemKind values; `moduleKind` is the enum
// value for module items and `snippetRule` the snippet insert-text rule.
export function buildSuggestions(entries, moduleNames, range, kinds, moduleKind, snippetRule) {
  const apiSuggestions = entries.map((e) => ({
    label: e.label,
    kind: kinds[e.kind],
    insertText: e.insertText,
    insertTextRules: snippetRule,
    detail: e.detail,
    range,
  }))
  const moduleSuggestions = (moduleNames || []).map((name) => ({
    label: name,
    kind: moduleKind,
    insertText: name,
    detail: "ViUR-Modul",
    range,
  }))
  return [...apiSuggestions, ...moduleSuggestions]
}

let registered = false

// Register the Scriptor completion provider for Python. `getModuleNames` is a
// callback returning the current list of module names (read lazily so it stays
// live). Registration is global per language, so it runs only once.
export function registerScriptorCompletions(monaco, getModuleNames) {
  if (registered) return
  registered = true

  const kinds = {
    Function: monaco.languages.CompletionItemKind.Function,
    Method: monaco.languages.CompletionItemKind.Method,
  }
  const moduleKind = monaco.languages.CompletionItemKind.Module
  const snippetRule = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet

  monaco.languages.registerCompletionItemProvider("python", {
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }
      let moduleNames = []
      try {
        moduleNames = getModuleNames() || []
      } catch (e) {
        moduleNames = []
      }
      return {
        suggestions: buildSuggestions(SCRIPTOR_API_ENTRIES, moduleNames, range, kinds, moduleKind, snippetRule),
      }
    },
  })
}
