import test from "node:test"
import assert from "node:assert/strict"

import {
  buildPdfViewerSlug,
  parsePdfDeepLink,
  resolveSiteRelativeTarget,
  toMarkdownPdfLink,
} from "../scripts/pdf-deeplink-shared.mjs"

test("parsePdfDeepLink reads page and selection", () => {
  assert.deepEqual(parsePdfDeepLink("references/file.pdf#page=7&selection=89,0,119,1"), {
    pdfPath: "references/file.pdf",
    page: 7,
    selection: "89,0,119,1",
  })
})

test("buildPdfViewerSlug produces stable route slugs", () => {
  assert.equal(
    buildPdfViewerSlug("references/file.pdf", 7, "89,0,119,1"),
    "__pdf-links/references/file-pdf/page-7/selection-89-0-119-1",
  )
})

test("resolveSiteRelativeTarget normalizes relative pdf hrefs", () => {
  assert.equal(
    resolveSiteRelativeTarget(
      "dravidian/south-central-dravidian/gondi/note",
      "../../../references/file.pdf#page=7&selection=89,0,119,1",
    ),
    "references/file.pdf#page=7&selection=89,0,119,1",
  )
})

test("toMarkdownPdfLink converts deep links to standard markdown", () => {
  assert.equal(
    toMarkdownPdfLink("Gondi Grammar by HD Williamson.pdf#page=7&selection=89,0,119,1", "page 7"),
    "[page 7](Gondi%20Grammar%20by%20HD%20Williamson.pdf#page=7&selection=89,0,119,1)",
  )
})
