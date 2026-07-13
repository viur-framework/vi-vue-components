// Helpers for interpreting responses from the Scriptor `generate` endpoint.

// A response is treated as a Scriptor script (rather than a conversational
// reply) when its trimmed text starts with the Scriptor header marker.
export function isScriptorCode(text) {
  return typeof text === "string" && text.trim().startsWith("#### scriptor ####")
}
