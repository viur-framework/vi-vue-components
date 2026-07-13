// Maps Ruff diagnostics (from the ruff-wasm worker) to Monaco marker data.

// `severity` provides the two monaco.MarkerSeverity values to use:
// { error, warning }. Ruff syntax errors (code "invalid-syntax") are errors,
// everything else is a warning. Ruff locations are 1-based row/column, which
// matches Monaco's lineNumber/column directly.
export function ruffDiagnosticsToMarkers(diagnostics, severity) {
  return (diagnostics || []).map((d) => ({
    startLineNumber: d.start_location.row,
    startColumn: d.start_location.column,
    endLineNumber: d.end_location.row,
    endColumn: d.end_location.column,
    message: d.code ? `${d.code}: ${d.message}` : d.message,
    severity: d.code === "invalid-syntax" ? severity.error : severity.warning,
  }))
}
