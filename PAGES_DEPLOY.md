# Deploying NRGTV to GitHub Pages

This repo now includes `.github/workflows/deploy-pages.yml`, which builds the
`artifacts/energy-tv` app and deploys it to GitHub Pages automatically.

## One-time setup

1. Push this repo to GitHub.
2. In the repo: **Settings → Pages → Build and deployment → Source** → select
   **GitHub Actions**.
3. (Optional) **Settings → Secrets and variables → Actions → New repository
   secret**:
   - Name: `VITE_TMDB_API_KEY`
   - Value: your TMDB API key

   The app works without this — it falls back to a static demo dataset — but
   live TMDB data needs the key.
4. Push to any branch (or run the workflow manually from the **Actions** tab,
   optionally typing a branch name to build that branch instead of the one
   the workflow run started on). Your site will appear at:
   - `https://<username>.github.io/<repo-name>/` (most repos), or
   - `https://<username>.github.io/` if the repo is literally named
     `<username>.github.io`.

The workflow detects which of these two cases applies automatically and sets
the Vite `base` path accordingly — no manual edits needed if you rename the
repo. Every push, on every branch, triggers a build and re-deploy to the same
Pages site (last push wins — there's no per-branch preview environment).

## What was fixed for Pages compatibility

- **Base path**: `vite.config.ts` already supported a `BASE_PATH` env var;
  the workflow now sets it correctly so all assets resolve under the repo
  subpath instead of 404ing at the domain root.
- **SPA routing fallback**: GitHub Pages has no server-side rewrites, so deep
  links (e.g. `/movies`, `/detail/movie/123`) would 404 on refresh. The
  workflow copies the built `index.html` to `404.html`, which Pages serves
  for any unmatched route, letting `wouter` take over client-side.
- **Jekyll bypass**: added a `.nojekyll` file so Pages doesn't try to process
  the output through Jekyll (which would ignore the `assets/` folder since it
  starts with `_`-like build tooling conventions Jekyll sometimes mishandles).
- **Unused workspace dependency removed**: `artifacts/energy-tv/package.json`
  listed `@workspace/api-client-react` as a dependency, but nothing in the
  app imports it (the app talks to TMDB directly from the browser). Removing
  it means the CI build doesn't need to build that internal package first.
- **Monorepo-aware build**: the workflow uses `pnpm` (not `npm`/`yarn`, which
  this repo's `preinstall` script blocks) and only builds the `energy-tv`
  workspace package rather than the whole monorepo, since that's the only
  piece that needs to ship to Pages.

## Local build check

```bash
pnpm install
cd artifacts/energy-tv
PORT=5000 BASE_PATH=/your-repo-name/ pnpm run build
```

Output lands in `artifacts/energy-tv/dist/public`.
