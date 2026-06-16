# Diachronics notes

This repository now builds as a Quartz site from the Markdown and reference files in `content/`.

## Local preview

```bash
npm ci
npx quartz plugin install
npx quartz build --serve
```

Then open `http://localhost:8080`.

## Editing notes

Open this repository folder itself as an Obsidian vault if you want Quartz and the notes to live in the same project root. The publishable notes live under `content/`.

## Deployment

GitHub Actions in `.github/workflows/deploy.yml` builds the site on pushes to `main`. In the repository settings, set Pages to use `GitHub Actions` as the source.
