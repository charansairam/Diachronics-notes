export declare const manifest: {
  name: string
  displayName: string
  description: string
  version: string
  quartzVersion: string
  category: string
  defaultOrder: number
}

export declare function convertPdfWikilinks(src: string): string

export default function PdfDeepLinkMarkdown(): {
  name: string
  textTransform(_ctx: unknown, src: string): string
}
