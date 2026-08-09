export function parsePdfDeepLink(target: string): {
  pdfPath: string
  page: number
  selection: string | null
} | null
export function escapeMarkdownText(text: string): string
export function toMarkdownPdfLink(target: string, alias?: string | null): string | null
