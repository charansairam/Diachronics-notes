import path from "node:path"

export const PDF_DEEPLINK_PREFIX = "__pdf-links"
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
  return `${PDF_DEEPLINK_PREFIX}/${base}/${pageSegment}${selectionSegment}`
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
  const currentDir = path.posix.dirname(currentSlug)
  let relativePath = path.posix.relative(currentDir, routeSlug)
  if (relativePath === "") {
    relativePath = "."
  }

  if (!relativePath.startsWith(".") && !relativePath.startsWith("/")) {
    relativePath = `./${relativePath}`
  }

  return relativePath
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
