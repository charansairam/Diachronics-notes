export declare const manifest: {
  name: string
  displayName: string
  description: string
  version: string
  quartzVersion: string
  category: string
  defaultOrder: number
}

export default function PdfDeepLinkViewer(): {
  name: string
  emit(ctx: unknown, content: unknown[]): Promise<string[]>
}
