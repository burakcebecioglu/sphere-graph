# Contributing to sphere-graph

Thank you for contributing. This project uses a **`develop` integration branch**
and releases from **`main`** — features are batched on `develop` and published
to npm only when a release is tagged.

## Branch model

```text
feat/*  ──PR──►  develop  ──PR (release)──►  main  ──tag vX.Y.Z──►  npm
                     ▲                          │
                     └──── merge main ──────────┘
                          (after each release)
```

| Branch | Branches from | Merges into | Purpose |
|---|---|---|---|
| `feat/*` | `develop` | `develop` | New features |
| `fix/*` | `develop` | `develop` | Bug fixes |
| `chore/*` | `develop` | `develop` | CI, docs, tooling |
| `develop` | — | `main` | Release PR only |
| `fix/*` (hotfix) | `main` | `main` + `develop` | Urgent post-release fix |

**Rules:**

- Open PRs against **`develop`**, not `main` (except release and hotfix PRs).
- Do **not** bump `package.json` version on feature branches.
- Do **not** tag or publish from `develop`.
- v1.0 features land on `develop`; npm releases are **batched**, not per feature.

## Daily workflow

```bash
git checkout develop
git pull origin develop
git checkout -b feat/my-feature
# ... edit, commit ...
git push -u origin feat/my-feature
# Open PR: feat/my-feature → develop
```

Before opening a PR, run locally:

```bash
npm test && npm run typecheck && npm run build
```

CI (typecheck, test, build, pack dry-run) runs on pushes and PRs to `main` and
`develop`.

## Git worktrees (optional)

Worktrees let you keep **`main`** and **`develop`** in separate folders without
switching branches or stashing.

### Recommended layout

| Folder | Branch | Purpose |
|---|---|---|
| `sphere-graph/` | `main` | Releases, hotfixes, tagging |
| `sphere-graph-develop/` | `develop` | Integration; default daily work |

### One-time setup

From your primary clone (on `main`):

```bash
git pull origin main
git fetch origin develop   # after develop exists on remote
git worktree add ../sphere-graph-develop develop
cd ../sphere-graph-develop
npm install
```

Each worktree has its own working tree and `node_modules`. Run `npm install`
once per worktree.

### Feature worktree (parallel work)

```bash
cd ../sphere-graph-develop
git pull origin develop
git worktree add ../sphere-graph-feat-search -b feat/search develop
cd ../sphere-graph-feat-search
npm install
# ... work ...
git worktree remove ../sphere-graph-feat-search   # when done
```

### Useful commands

```bash
git worktree list
git worktree prune
```

## Releasing to npm

Releases merge **`develop` → `main`**, bump the version, update
[`CHANGELOG.md`](CHANGELOG.md), tag, and push the tag. The
[Release workflow](.github/workflows/release.yml) publishes to npm via Trusted
Publishing (no `NPM_TOKEN`).

```bash
# 1. Release PR on GitHub: develop → main
#    Include version bump in package.json and CHANGELOG update

# 2. After merge, from main worktree:
git checkout main
git pull origin main
git tag v0.4.0
git push origin v0.4.0

# 3. Sync develop with main (version bump + release commits)
git checkout develop
git pull origin develop
git merge main
git push origin develop
```

Do **not** re-tag a version already on npm.

## Hotfix workflow

For urgent fixes on a released version:

```bash
git checkout main
git pull origin main
git checkout -b fix/critical-bug
# ... fix, commit ...
git push -u origin fix/critical-bug
# PR: fix/critical-bug → main
# Bump patch version, update CHANGELOG, tag v0.3.1, push tag

git checkout develop
git pull origin develop
git merge main
git push origin develop
```

## Maintainer setup (GitHub)

These settings are configured in the GitHub repo UI (not in this repository):

- **Default branch:** keep **`main`** (npm consumers and release tags point here).
- **Branch protection — `main`:**
  - Require a pull request before merging
  - Require the CI `build` job to pass
  - Optionally restrict who can push directly
- **Branch protection — `develop`:**
  - Require the CI `build` job to pass on pull requests
  - Direct pushes optional for solo maintainers
- **Delete merged branches:** enable in repo settings or clean up manually

Optional: use [`gh`](https://cli.github.com/) to inspect branch protection:

```bash
gh api repos/burakcebecioglu/sphere-graph/branches/main/protection
gh api repos/burakcebecioglu/sphere-graph/branches/develop/protection
```

## Roadmap

Features targeting **v1.0** (search, filters, responsive embed, a11y, etc.)
integrate on **`develop`**. **Multi-sphere layout** is planned for a future major
release after v1.0.

See [`CHANGELOG.md`](CHANGELOG.md) for release history.
