export function parsePdfDeepLink(target: string): {
  pdfPath: string
  page: number
  selection: string | null
} | null
export function buildPdfViewerSlug(
  pdfPath: string,
  page: number,
  selection?: string | null,
): string
export function buildPdfAssetHref(currentSlug: string, pdfPath: string): string
export function collectPdfDeepLinks(tree: unknown, visit: Function): Set<string>
export function viewerTitleForPath(pdfPath: string, page: number): string
