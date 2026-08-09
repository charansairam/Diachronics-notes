import { toMarkdownPdfLink } from "./shared.js"

export const manifest = {
  name: "pdf-deeplink-markdown",
  displayName: "PDF Deep Link Markdown",
  description: "Converts Obsidian PDF deep-link wikilinks into Markdown links that Quartz can preserve.",
  version: "0.1.0",
  quartzVersion: ">=5.0.0",
  category: "transformer",
  defaultOrder: 25,
}

const PDF_WIKILINK_RE =
  /\[\[([^\]|]+?\.pdf#page=\d+(?:&selection=\d+,\d+,\d+,\d+)?)(?:\|([^\]]*))?\]\]/gi

export function convertPdfWikilinks(src) {
  return String(src).replace(PDF_WIKILINK_RE, (_match, target, alias) => {
    const markdown = toMarkdownPdfLink(target, alias)
    return markdown ?? _match
  })
}

export default function PdfDeepLinkMarkdown() {
  return {
    name: "PdfDeepLinkMarkdown",
    textTransform(_ctx, src) {
      return convertPdfWikilinks(src)
    },
  }
}
