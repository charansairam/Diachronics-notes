import fs from "fs";
import path from "path";
import { styleText } from "util";
import { Repository } from "@napi-rs/simple-git";

const defaultOptions = {
  priority: ["frontmatter", "git", "filesystem"],
  defaultDateType: "published",
};

const iso8601DateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

function coerceDate(fp, d) {
  if (typeof d === "string" && iso8601DateOnlyRegex.test(d)) {
    d = `${d}T00:00:00`;
  }

  const dt = d === undefined ? new Date() : d === null ? new Date(0) : new Date(d);
  const invalidDate = Number.isNaN(dt.getTime()) || dt.getTime() === 0;

  if (invalidDate && d !== undefined) {
    console.log(
      styleText(
        "yellow",
        `\nWarning: found invalid date "${d}" in \`${fp}\`. Supported formats: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format`,
      ),
    );
  }

  return invalidDate ? new Date() : dt;
}

function normalizePathForLookup(value) {
  return value.replace(/\\/g, "/");
}

function loadSnapshotMap(rootDir) {
  const snapshotPath = path.join(rootDir, "quartz-data", "note-date-snapshot.json");

  try {
    const raw = fs.readFileSync(snapshotPath, "utf8");
    const parsed = JSON.parse(raw);
    const files = parsed.files ?? {};
    return new Map(Object.entries(files));
  } catch {
    return new Map();
  }
}

function getSnapshotEntry(snapshotMap, rootDir, fullPath, relativePath) {
  const candidates = new Set();

  if (relativePath) {
    candidates.add(normalizePathForLookup(relativePath));
  }

  const repoRelative = normalizePathForLookup(path.relative(rootDir, fullPath));
  candidates.add(repoRelative);

  if (repoRelative.startsWith("content/")) {
    candidates.add(repoRelative.slice("content/".length));
  }

  for (const candidate of candidates) {
    const match = snapshotMap.get(candidate);
    if (match) {
      return match;
    }
  }

  return undefined;
}

export const CreatedModifiedDate = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts };

  return {
    name: "CreatedModifiedDate",
    markdownPlugins(ctx) {
      return [
        () => {
          let repo;
          let repositoryWorkdir;
          const snapshotMap = loadSnapshotMap(ctx.argv.directory);

          if (opts.priority.includes("git")) {
            try {
              repo = Repository.discover(ctx.argv.directory);
              repositoryWorkdir = repo.workdir() ?? ctx.argv.directory;
            } catch {
              console.log(
                styleText(
                  "yellow",
                  `\nWarning: couldn't find git repository for ${ctx.argv.directory}`,
                ),
              );
            }
          }

          return async (_tree, file) => {
            let created;
            let modified;
            let published;

            const data = file.data;
            const fp = data.relativePath;
            const fullFp = data.filePath;
            const snapshotEntry = getSnapshotEntry(snapshotMap, ctx.argv.directory, fullFp, fp);

            for (const source of opts.priority) {
              if (source === "filesystem") {
                const st = await fs.promises.stat(fullFp);
                created ||= st.birthtimeMs;
                modified ||= st.mtimeMs;
              } else if (source === "frontmatter") {
                if (data.frontmatter) {
                  created ||= data.frontmatter.created;
                  modified ||= data.frontmatter.modified;
                  published ||= data.frontmatter.published;
                }

                created ||= snapshotEntry?.created;
                modified ||= snapshotEntry?.modified;
                published ||= snapshotEntry?.published ?? snapshotEntry?.created;
              } else if (source === "git" && repo) {
                try {
                  const relativePath = path.relative(repositoryWorkdir, fullFp);
                  modified ||= await repo.getFileLatestModifiedDateAsync(relativePath);
                } catch {
                  console.log(
                    styleText(
                      "yellow",
                      `\nWarning: ${data.filePath} isn't yet tracked by git, dates will be inaccurate`,
                    ),
                  );
                }
              }
            }

            created ||= modified ?? published;
            modified ||= created ?? published;
            published ||= created ?? modified;

            data.dates = {
              created: coerceDate(fp, created),
              modified: coerceDate(fp, modified),
              published: coerceDate(fp, published),
            };
            data.defaultDateType = opts.defaultDateType;
          };
        },
      ];
    },
  };
};
