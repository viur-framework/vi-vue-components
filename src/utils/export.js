import ExcelJS from "exceljs"
import { boneLogic } from "@viur/vue-utils"

/**
 * This helper normalizes arbitrary cell values into a printable fallback string.
 * It is used whenever export targets need a stable scalar value instead of nested data.
 */
function stringifyCellValue(value) {
  if (value === null || value === undefined || value === "") {
    return "-"
  }

  if (Array.isArray(value) || typeof value === "object") {
    try {
      return JSON.stringify(value)
    } catch (error) {
      return String(value)
    }
  }

  return String(value)
}

/**
 * This helper reuses the same bone rendering logic as the list handler for string exports.
 * It keeps export output aligned with the values users already see in the admin tables.
 */
function getBoneLogicValue(row, boneName, structure, lang = null, t = null) {
  const boneStructure = structure?.[boneName] || {}
  const { getBoneValue } = boneLogic(row, structure, false, lang, t)
  let option = null

  if (boneStructure?.type === "date") {
    if (boneStructure?.date && !boneStructure?.time) {
      option = "date"
    }

    if (boneStructure?.time && !boneStructure?.date) {
      option = "time"
    }
  }

  return getBoneValue(boneName, option, row)
}

function getRawColumnValue(row, column) {
  let value = row?.[column.boneName]

  if (column.lang) {
    if (!value || typeof value !== "object") {
      return null
    }
    value = value[column.lang]
  }

  return value
}

/**
 * This helper applies export-specific string overrides before falling back to shared bone rendering.
 * It exists so file and spatial bones can produce the exact text format required by the export dialog.
 */
function formatSingleStringValue(value, boneStructure, row, boneName, lang = null, t = null) {
  if (value === null || value === undefined || value === "") {
    return "-"
  }

  const boneType = boneStructure?.type || ""

  const isFileLikeType =
    boneType === "file" ||
    boneType.startsWith("file.") ||
    boneType.endsWith(".file") ||
    boneType.includes(".file.")

  if (isFileLikeType) {
    if (value?.dest?.name) {
      return decodeURIComponent(value.dest.name)
    }
    if (value?.name) {
      return decodeURIComponent(value.name)
    }
  }

  if (boneType === "spatial" || boneType.startsWith("spatial.")) {
    const lat = Array.isArray(value) ? value[0] : value?.lat ?? value?.latitude ?? null
    const lng = Array.isArray(value) ? value[1] : value?.lng ?? value?.long ?? value?.longitude ?? null

    if (lat === null || lng === null || lat === undefined || lng === undefined) {
      return "-"
    }

    return `long: ${lng}, lat: ${lat}`
  }

  return getBoneLogicValue(row, boneName, structureWithColumnLanguage(structureFromBone(boneName, boneStructure), boneName, lang), lang, t)
}

function structureFromBone(boneName, boneStructure) {
  return {
    [boneName]: boneStructure,
  }
}

function structureWithColumnLanguage(structure, boneName, lang) {
  if (!lang || !structure?.[boneName]) {
    return structure
  }

  return {
    ...structure,
    [boneName]: {
      ...structure[boneName],
      languages: [lang],
    },
  }
}

/**
 * This function expands the selected bone list into concrete export columns.
 * It also splits multilingual bones into one column per language so exports stay explicit and flat.
 */
export function buildExportColumns(structure = {}, selectedBones = []) {
  const entries = Object.entries(structure || {})
  const orderedBones = []
  const selected = Array.isArray(selectedBones) ? selectedBones : []

  for (const boneName of selected) {
    if (structure?.[boneName] && !orderedBones.includes(boneName)) {
      orderedBones.push(boneName)
    }
  }

  for (const [boneName, boneStructure] of entries) {
    if (boneStructure?.visible === false) {
      continue
    }
    if (!orderedBones.includes(boneName)) {
      orderedBones.push(boneName)
    }
  }

  const columns = []

  for (const boneName of orderedBones) {
    const boneStructure = structure[boneName]
    if (!boneStructure) {
      continue
    }

    const baseLabel = boneStructure?.descr || boneName
    const languages = Array.isArray(boneStructure?.languages) ? boneStructure.languages : []

    if (languages.length > 0) {
      for (const lang of languages) {
        columns.push({
          id: `${boneName}__${lang}`,
          boneName,
          lang,
          label: `${baseLabel} (${lang.toUpperCase()})`,
        })
      }
      continue
    }

    columns.push({
      id: boneName,
      boneName,
      lang: null,
      label: baseLabel,
    })
  }

  return columns
}

/**
 * This function converts one row value into the final export representation for the chosen format.
 * It handles the switch between text-oriented exports and structured JSON-style exports in one place.
 */
export function formatExportValue({
  column,
  row,
  structure,
  objectMode = "string",
  outputFormat = "preview",
  t = null,
}) {
  const boneStructure = structure?.[column.boneName] || {}
  const rawValue = getRawColumnValue(row, column)
  const isMultiple = !!boneStructure?.multiple
  const multipleMode = objectMode === "json" ? "list" : "string"

  if (objectMode === "json") {
    if (!isMultiple) {
      if (outputFormat === "json") {
        return rawValue ?? null
      }
      return stringifyCellValue(rawValue)
    }

    const listValue = Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : []

    if (multipleMode === "string") {
      const joined = listValue.map((entry) => stringifyCellValue(entry)).join(", ")
      return joined || "-"
    }

    if (outputFormat === "json") {
      return listValue
    }

    return stringifyCellValue(listValue)
  }

  if (!isMultiple) {
    return formatSingleStringValue(rawValue, boneStructure, row, column.boneName, column.lang, t)
  }

  const listValue = Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : []
  const formattedList = listValue.map((entry) =>
    formatSingleStringValue(entry, { ...boneStructure, multiple: false }, { ...row, [column.boneName]: entry }, column.boneName, column.lang, t)
  )

  if (multipleMode === "list") {
    if (outputFormat === "json") {
      return formattedList
    }
    return stringifyCellValue(formattedList)
  }

  return formattedList.join(", ") || "-"
}

/**
 * This function transforms raw handler rows into a tabular export model with headers and normalized values.
 * The preview table and all download formats use this shared transformation so they stay consistent.
 */
export function rowsToExportTable({
  rows = [],
  columns = [],
  structure = {},
  objectMode = "string",
  outputFormat = "preview",
  t = null,
}) {
  const headers = columns.map((column) => column.label)
  const rowObjects = rows.map((row) => {
    const result = {}

    for (const column of columns) {
      result[column.label] = formatExportValue({
        column,
        row,
        structure,
        objectMode,
        outputFormat,
        t,
      })
    }

    return result
  })

  const rowArrays = rowObjects.map((rowObject) => headers.map((header) => stringifyCellValue(rowObject[header])))

  return {
    headers,
    rowObjects,
    rowArrays,
  }
}

function triggerDownload(blob, filename) {
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function buildFilename(moduleName, extension) {
  const now = new Date()
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
  ].join("-")

  const safeModuleName = String(moduleName || "export").replace(/[/.\\\s]+/g, "-")
  return `${safeModuleName}-export-${timestamp}.${extension}`
}

export function downloadJson(moduleName, rows) {
  const blob = new Blob([JSON.stringify(rows, null, 2)], {
    type: "application/json;charset=utf-8",
  })
  triggerDownload(blob, buildFilename(moduleName, "json"))
}

/**
 * This helper escapes a single CSV cell according to delimiter-sensitive CSV rules.
 * It prevents commas, semicolons, quotes, and line breaks from corrupting exported rows.
 */
function escapeCsvCell(value) {
  const normalized = value === null || value === undefined ? "" : String(value)

  if (
    normalized.includes('"') ||
    normalized.includes("\n") ||
    normalized.includes("\r") ||
    normalized.includes(",") ||
    normalized.includes(";")
  ) {
    return `"${normalized.replace(/"/g, '""')}"`
  }

  return normalized
}

/**
 * This function writes the normalized export rows as a CSV download with the chosen delimiter.
 * It adds a UTF-8 BOM so spreadsheet tools open the file with the expected encoding.
 */
export function downloadCsv(moduleName, rows, delimiter = ";") {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : []
  const lines = []

  if (headers.length > 0) {
    lines.push(headers.map((header) => escapeCsvCell(header)).join(delimiter))

    for (const row of rows) {
      lines.push(headers.map((header) => escapeCsvCell(row[header])).join(delimiter))
    }
  }

  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  })
  triggerDownload(blob, buildFilename(moduleName, "csv"))
}

/**
 * This function writes the normalized export rows into a real XLSX workbook using ExcelJS.
 * It keeps the implementation separate from the table-building step so download concerns stay isolated.
 */
export async function downloadExcel(moduleName, rows) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet("Export")

  const headers = rows.length > 0 ? Object.keys(rows[0]) : []
  if (headers.length > 0) {
    worksheet.columns = headers.map((header) => ({
      header,
      key: header,
      width: Math.min(Math.max(header.length + 4, 16), 48),
    }))
    worksheet.addRows(rows)
    worksheet.getRow(1).font = { bold: true }
  }

  const workbookData = await workbook.xlsx.writeBuffer()
  const blob = new Blob([workbookData], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  triggerDownload(blob, buildFilename(moduleName, "xlsx"))
}
