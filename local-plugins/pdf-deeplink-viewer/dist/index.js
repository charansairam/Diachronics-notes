import fs from "node:fs/promises"
import path from "node:path"
import { visit } from "unist-util-visit"
import {
  buildPdfAssetHref,
  buildPdfViewerSlug,
  collectPdfDeepLinks,
  parsePdfDeepLink,
  viewerTitleForPath,
} from "./shared.js"

export const manifest = {
  name: "pdf-deeplink-viewer",
  displayName: "PDF Deep Link Viewer",
  description: "Emits viewer pages and bundled assets for exact PDF page and selection rendering.",
  version: "0.1.0",
  quartzVersion: ">=5.0.0",
  category: "emitter",
  defaultOrder: 15,
}

const VIEWER_ASSET_DIR = "static/pdf-deeplinks"
const PDFJS_BUILD_DIR = "node_modules/pdfjs-dist/build"

const VIEWER_JS = String.raw`import * as pdfjsLib from "./pdf.mjs"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("./pdf.worker.mjs", import.meta.url).toString()

const data = JSON.parse(document.getElementById("pdf-deeplink-data").textContent)
const state = {
  document: null,
  pageNumber: data.page,
  totalPages: 0,
  selection: data.selection,
  renderNonce: 0,
}

const body = document.body
const canvas = document.getElementById("pdf-canvas")
const canvasContext = canvas.getContext("2d", { alpha: false })
const textLayer = document.getElementById("pdf-text-layer")
const highlightLayer = document.getElementById("pdf-highlight-layer")
const pageLabel = document.getElementById("page-label")
const titleLabel = document.getElementById("viewer-title")
const rawLink = document.getElementById("open-raw-pdf")
const prevButton = document.getElementById("page-prev")
const nextButton = document.getElementById("page-next")
const errorBox = document.getElementById("pdf-error")
const viewportHost = document.getElementById("pdf-viewport")

if (window.self !== window.top) {
  body.classList.add("is-preview")
}

titleLabel.textContent = data.title
rawLink.href = data.rawHref
rawLink.textContent = "Open raw PDF"

prevButton.addEventListener("click", () => changePage(-1))
nextButton.addEventListener("click", () => changePage(1))
window.addEventListener("resize", debounce(() => renderPage(), 100))

boot().catch((error) => showError(error))

async function boot() {
  const loadingTask = pdfjsLib.getDocument({ url: data.pdfHref })
  state.document = await loadingTask.promise
  state.totalPages = state.document.numPages
  state.pageNumber = Math.min(Math.max(1, state.pageNumber), state.totalPages)
  updateToolbar()
  await renderPage()
}

function debounce(fn, delay) {
  let timer = null
  return () => {
    window.clearTimeout(timer)
    timer = window.setTimeout(fn, delay)
  }
}

function changePage(delta) {
  if (!state.document) return
  const next = Math.min(Math.max(1, state.pageNumber + delta), state.totalPages)
  if (next === state.pageNumber) return
  state.pageNumber = next
  updateToolbar()
  renderPage().catch((error) => showError(error))
}

function updateToolbar() {
  pageLabel.textContent = "Page " + state.pageNumber + " of " + state.totalPages
  prevButton.disabled = state.pageNumber <= 1
  nextButton.disabled = state.pageNumber >= state.totalPages
}

async function renderPage() {
  if (!state.document) return
  const nonce = ++state.renderNonce
  errorBox.hidden = true

  const page = await state.document.getPage(state.pageNumber)
  const baseViewport = page.getViewport({ scale: 1 })
  const availableWidth = Math.max(320, viewportHost.clientWidth - 24)
  const scale = availableWidth / baseViewport.width
  const viewport = page.getViewport({ scale })

  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  canvas.style.width = viewport.width + "px"
  canvas.style.height = viewport.height + "px"

  viewportHost.style.width = viewport.width + "px"
  viewportHost.style.height = viewport.height + "px"
  textLayer.style.width = viewport.width + "px"
  textLayer.style.height = viewport.height + "px"
  textLayer.style.setProperty("--scale-factor", String(scale))
  highlightLayer.style.width = viewport.width + "px"
  highlightLayer.style.height = viewport.height + "px"

  clearNode(textLayer)
  clearNode(highlightLayer)

  await page.render({ canvasContext, viewport }).promise
  const textContent = await page.getTextContent()
  if (nonce !== state.renderNonce) return

  const layer = new pdfjsLib.TextLayer({
    textContentSource: textContent,
    container: textLayer,
    viewport,
  })
  await layer.render()
  if (nonce !== state.renderNonce) return

  if (state.selection && state.pageNumber === data.page) {
    renderSelectionHighlight(textContent.items, state.selection)
  }
}

function renderSelectionHighlight(items, selection) {
  const spans = Array.from(textLayer.querySelectorAll("span"))
  const [beginIndex, beginOffset, endIndex, endOffset] = selection
  const bounds = textLayer.getBoundingClientRect()
  let firstHighlight = null

  for (let index = beginIndex; index <= endIndex; index += 1) {
    const span = spans[index]
    if (!span) continue
    const textNode = span.firstChild
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) continue

    const value = textNode.textContent ?? ""
    const start = index === beginIndex ? clamp(beginOffset, 0, value.length) : 0
    const end = index === endIndex ? clamp(endOffset, 0, value.length) : value.length
    if (start >= end) continue

    const range = document.createRange()
    range.setStart(textNode, start)
    range.setEnd(textNode, end)

    for (const rect of range.getClientRects()) {
      const highlight = document.createElement("div")
      highlight.className = "selection-highlight"
      highlight.style.left = rect.left - bounds.left + "px"
      highlight.style.top = rect.top - bounds.top + "px"
      highlight.style.width = rect.width + "px"
      highlight.style.height = rect.height + "px"
      highlightLayer.appendChild(highlight)
      if (!firstHighlight) {
        firstHighlight = highlight
      }
    }
  }

  firstHighlight?.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" })
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function clearNode(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild)
  }
}

function showError(error) {
  console.error(error)
  errorBox.hidden = false
  errorBox.textContent = "Unable to render this PDF deep link."
}
`

const VIEWER_CSS = String.raw`:root {
  color-scheme: light dark;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: "Source Sans 3", "Segoe UI", sans-serif;
  background: #121214;
  color: #f1f1f1;
}

body.is-preview {
  background: transparent;
}

.viewer-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

body.is-preview .viewer-shell {
  min-height: auto;
}

.viewer-toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(18, 18, 20, 0.96);
  position: sticky;
  top: 0;
  z-index: 5;
}

body.is-preview .viewer-toolbar {
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
}

.viewer-toolbar-left,
.viewer-toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.viewer-title {
  font-weight: 600;
}

.viewer-toolbar button,
.viewer-toolbar a {
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.06);
  color: inherit;
  padding: 0.45rem 0.7rem;
  text-decoration: none;
}

.viewer-toolbar button:disabled {
  opacity: 0.4;
  cursor: default;
}

.viewer-main {
  display: flex;
  justify-content: center;
  padding: 1rem;
}

body.is-preview .viewer-main {
  padding: 0.5rem;
}

.pdf-stage {
  position: relative;
  background: #fff;
  box-shadow: 0 24px 50px rgba(0, 0, 0, 0.25);
  max-width: 100%;
}

.pdf-canvas {
  display: block;
  max-width: 100%;
}

.pdf-text-layer,
.pdf-highlight-layer {
  position: absolute;
  inset: 0;
}

.pdf-highlight-layer {
  pointer-events: none;
  z-index: 4;
}

.selection-highlight {
  position: absolute;
  background: rgba(255, 235, 107, 0.5);
  border-radius: 0.15rem;
}

.textLayer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  opacity: 1;
  line-height: 1;
  z-index: 3;
  transform-origin: 0 0;
  forced-color-adjust: none;
}

.textLayer :is(span, br) {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0 0;
}

.textLayer > :not(.markedContent),
.textLayer .markedContent span:not(.markedContent) {
  z-index: 1;
}

.viewer-error {
  margin: 0 1rem 1rem;
  padding: 0.85rem 1rem;
  border-radius: 0.5rem;
  background: rgba(164, 40, 40, 0.18);
  color: #ffd3d3;
}
`

function viewerTitleFor(parsed) {
  return viewerTitleForPath(parsed.pdfPath, parsed.page)
}

function createViewerHtml(routeSlug, parsed) {
  const cssHref = buildPdfAssetHref(routeSlug, `${VIEWER_ASSET_DIR}/viewer.css`)
  const jsHref = buildPdfAssetHref(routeSlug, `${VIEWER_ASSET_DIR}/viewer.mjs`)
  const pdfHref = buildPdfAssetHref(routeSlug, parsed.pdfPath)
  const rawHref = `${pdfHref}#page=${parsed.page}`
  const title = viewerTitleFor(parsed)
  const selection = parsed.selection
    ? parsed.selection.split(",").map((value) => Number(value))
    : null

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="${cssHref}" />
  </head>
  <body>
    <main class="viewer-shell">
      <header class="viewer-toolbar">
        <div class="viewer-toolbar-left">
          <strong id="viewer-title" class="viewer-title"></strong>
          <span id="page-label"></span>
        </div>
        <div class="viewer-toolbar-right">
          <button id="page-prev" type="button">Prev</button>
          <button id="page-next" type="button">Next</button>
          <a id="open-raw-pdf" target="_blank" rel="noreferrer"></a>
        </div>
      </header>
      <p id="pdf-error" class="viewer-error" hidden></p>
      <section class="viewer-main">
        <div id="pdf-viewport" class="pdf-stage">
          <canvas id="pdf-canvas" class="pdf-canvas"></canvas>
          <div id="pdf-text-layer" class="pdf-text-layer textLayer"></div>
          <div id="pdf-highlight-layer" class="pdf-highlight-layer"></div>
        </div>
      </section>
    </main>
    <script id="pdf-deeplink-data" type="application/json">${escapeJsonScript(
      JSON.stringify({
        title,
        page: parsed.page,
        selection,
        pdfHref,
        rawHref,
      }),
    )}</script>
    <script type="module" src="${jsHref}"></script>
  </body>
</html>`
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function escapeJsonScript(value) {
  return String(value)
    .replaceAll("</script", "<\\/script")
    .replaceAll("<!--", "<\\!--")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029")
}

async function writeOutput(ctx, slug, ext, content) {
  const outputPath = path.join(ctx.argv.output, `${slug}${ext}`)
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, content)
  return outputPath
}

async function copyOutput(ctx, slug, sourcePath) {
  const outputPath = path.join(ctx.argv.output, slug)
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.copyFile(sourcePath, outputPath)
  return outputPath
}

function collectEntries(content) {
  const entries = new Map()

  for (const [tree] of content) {
    const deepLinks = collectPdfDeepLinks(tree, visit)
    for (const target of deepLinks) {
      const parsed = parsePdfDeepLink(target)
      if (!parsed) continue
      const routeSlug = buildPdfViewerSlug(parsed.pdfPath, parsed.page, parsed.selection)
      entries.set(routeSlug, parsed)
    }
  }

  return entries
}

export default function PdfDeepLinkViewer() {
  return {
    name: "PdfDeepLinkViewer",
    async emit(ctx, content) {
      const outputs = []
      const entries = collectEntries(content)

      outputs.push(
        await copyOutput(
          ctx,
          `${VIEWER_ASSET_DIR}/pdf.mjs`,
          path.join(PDFJS_BUILD_DIR, "pdf.mjs"),
        ),
      )
      outputs.push(
        await copyOutput(
          ctx,
          `${VIEWER_ASSET_DIR}/pdf.worker.mjs`,
          path.join(PDFJS_BUILD_DIR, "pdf.worker.mjs"),
        ),
      )
      outputs.push(await writeOutput(ctx, `${VIEWER_ASSET_DIR}/viewer.mjs`, "", VIEWER_JS))
      outputs.push(await writeOutput(ctx, `${VIEWER_ASSET_DIR}/viewer.css`, "", VIEWER_CSS))

      for (const [routeSlug, parsed] of entries) {
        outputs.push(await writeOutput(ctx, routeSlug, ".html", createViewerHtml(routeSlug, parsed)))
      }

      return outputs
    },
  }
}
