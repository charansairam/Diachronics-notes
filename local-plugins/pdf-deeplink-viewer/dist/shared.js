import path from "node:path"
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

export function buildPdfViewerSlug(pdfPath, page, selection = null) {
  const base = pdfPath.replace(/\.pdf$/i, "-pdf")
  const pageSegment = `page-${page}`
  const selectionSegment = selection ? `/selection-${selection.replaceAll(",", "-")}` : ""
  return `__pdf-links/${base}/${pageSegment}${selectionSegment}`
}

export function buildPdfAssetHref(currentSlug, pdfPath) {
  const currentDir = path.posix.dirname(currentSlug)
  let relativePath = path.posix.relative(currentDir, pdfPath)
  if (relativePath === "") {
    relativePath = "."
  }

  if (!relativePath.startsWith(".") && !relativePath.startsWith("/")) {
    relativePath = `./${relativePath}`
  }

  return relativePath
}

export function collectPdfDeepLinks(tree, visit) {
  const results = new Set()

  visit(tree, "element", (node) => {
    if (node?.tagName !== "a") return
    const source = node.properties?.["data-pdf-source"]
    if (typeof source === "string") {
      results.add(source)
    }
  })

  return results
}

export function viewerTitleForPath(pdfPath, page) {
  const fileName = path.posix.basename(pdfPath, ".pdf").replaceAll("-", " ")
  return `${fileName}, page ${page}`
}
