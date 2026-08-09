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
export function resolveSiteRelativeTarget(currentSlug: string, href: string): string | null
export function buildViewerHref(currentSlug: string, pdfTarget: string): string | null
