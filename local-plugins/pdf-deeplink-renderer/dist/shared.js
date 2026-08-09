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

export function resolveSiteRelativeTarget(currentSlug, href) {
  if (typeof currentSlug !== "string" || typeof href !== "string") return null

  const decodedHref = decodeURI(href)
  const [rawPath, fragment = ""] = decodedHref.split("#", 2)
  if (!rawPath.toLowerCase().endsWith(".pdf")) return null

  const currentDir = path.posix.dirname(currentSlug)
  const absolutePath = rawPath.startsWith("/")
    ? rawPath.slice(1)
    : path.posix.normalize(path.posix.join(currentDir, rawPath))

  return fragment ? `${absolutePath}#${fragment}` : absolutePath
}

export function buildViewerHref(currentSlug, pdfTarget) {
  const parsed = parsePdfDeepLink(pdfTarget)
  if (!parsed) return null

  const routeSlug = buildPdfViewerSlug(parsed.pdfPath, parsed.page, parsed.selection)
  return relativeHref(currentSlug, routeSlug)
}

function relativeHref(currentSlug, targetPath) {
  const currentDir = path.posix.dirname(currentSlug)
  let relativePath = path.posix.relative(currentDir, targetPath)
  if (relativePath === "") {
    relativePath = "."
  }

  if (!relativePath.startsWith(".") && !relativePath.startsWith("/")) {
    relativePath = `./${relativePath}`
  }

  return relativePath
}
