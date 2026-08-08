import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { globby } from "globby"

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), "..")
const contentRoot = path.join(repoRoot, "content")
const snapshotPath = path.join(repoRoot, "quartz-data", "note-date-snapshot.json")

if (process.env.CI) {
  console.log("Skipping local note date snapshot in CI; using committed snapshot if present.")
  process.exit(0)
}

function normalizeSlashes(value) {
  return value.replace(/\\/g, "/")
}

function toIso(value) {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const files = await globby(["**/*.md", "**/*.base"], {
  cwd: contentRoot,
  absolute: true,
  onlyFiles: true,
})

const entries = {}

for (const absolutePath of files) {
  const stats = await fs.stat(absolutePath)
  const relativePath = normalizeSlashes(path.relative(contentRoot, absolutePath))
  const created = toIso(stats.birthtime)
  const modified = toIso(stats.mtime)

  entries[relativePath] = {
    created,
    modified,
    published: created,
  }
}

const snapshot = {
  version: 1,
  generatedAt: new Date().toISOString(),
  source: "local-filesystem",
  files: entries,
}

await fs.mkdir(path.dirname(snapshotPath), { recursive: true })
await fs.writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8")

console.log(`Wrote local note date snapshot for ${files.length} files to ${snapshotPath}`)
