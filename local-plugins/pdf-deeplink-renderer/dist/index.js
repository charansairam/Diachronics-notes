import { visit } from "unist-util-visit"
import {
  buildViewerHref,
  parsePdfDeepLink,
  resolveSiteRelativeTarget,
} from "./shared.js"

export const manifest = {
  name: "pdf-deeplink-renderer",
  displayName: "PDF Deep Link Renderer",
  description: "Rewrites rendered PDF deep links to generated viewer pages and marks them for custom previews.",
  version: "0.1.0",
  quartzVersion: ">=5.0.0",
  category: "transformer",
  defaultOrder: 65,
}

function rewritePdfDeepLinks(tree, file) {
  const currentSlug = file?.data?.slug
  if (typeof currentSlug !== "string" || currentSlug.length === 0) return

  visit(tree, "element", (node) => {
    if (node?.tagName !== "a") return

    const href = node.properties?.href
    if (typeof href !== "string" || !href.toLowerCase().includes(".pdf#page=")) return

    const resolvedTarget = resolveSiteRelativeTarget(currentSlug, href)
    if (!resolvedTarget) return

    const parsed = parsePdfDeepLink(resolvedTarget)
    if (!parsed) return

    const viewerHref = buildViewerHref(currentSlug, resolvedTarget)
    if (!viewerHref) return

    node.properties.href = viewerHref
    node.properties["data-pdf-deeplink"] = "true"
    node.properties["data-pdf-source"] = resolvedTarget
    node.properties["data-router-ignore"] = "true"
  })
}

export default function PdfDeepLinkRenderer() {
  return {
    name: "PdfDeepLinkRenderer",
    htmlPlugins(_ctx) {
      return [() => (tree, file) => rewritePdfDeepLinks(tree, file)]
    },
  }
}
