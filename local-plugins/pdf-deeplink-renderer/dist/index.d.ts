export declare const manifest: {
  name: string
  displayName: string
  description: string
  version: string
  quartzVersion: string
  category: string
  defaultOrder: number
}

export default function PdfDeepLinkRenderer(): {
  name: string
  htmlPlugins(_ctx: unknown): Array<() => (tree: unknown, file: { data?: { slug?: string } }) => void>
}
