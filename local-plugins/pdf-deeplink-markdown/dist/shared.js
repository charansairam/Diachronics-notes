const PDF_SELECTION_RE = /^\d+,\d+,\d+,\d+$/

export function parsePdfDeepLink(target) {
  if (typeof target !== "string" || target.length === 0) return null

  const decoded = decodeURI(target)
  const [pdfPath, fragment = ""] = decoded.split("#", 2)
  if (!pdfPath.toLowerCase().endsWith(".pdf")) return null

  const params = new URLSearchParams(fragment)
  const pageValue = params.get("page")
  if (!pageValue || !/^\d+$/.test(pageValue)) return null

  const page = Number(pageValue)
  if (!Number.isInteger(page) || page < 1) return null

  const selectionValue = params.get("selection")
  if (selectionValue && !PDF_SELECTION_RE.test(selectionValue)) return null

  return {
    pdfPath,
    page,
    selection: selectionValue ?? null,
  }
}

export function escapeMarkdownText(text) {
  return String(text).replace(/([\\\[\]])/g, "\\$1")
}

export function toMarkdownPdfLink(target, alias = null) {
  const parsed = parsePdfDeepLink(target)
  if (!parsed) return null

  const encodedPath = encodeURI(parsed.pdfPath)
  const fragment = `page=${parsed.page}${parsed.selection ? `&selection=${parsed.selection}` : ""}`
  const label = escapeMarkdownText(alias ?? target)
  return `[${label}](${encodedPath}#${fragment})`
}
