# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite demo playground (root is demo/, imports ../src directly)
npm test             # vitest run — unit + React interaction tests
npm run test:watch   # vitest watch mode
npm run typecheck    # tsc --noEmit over src + demo
npm run build        # tsup (ESM) + tsc -p tsconfig.build.json (.d.ts) + copy-css.mjs
```

Run a single test file or test:

```bash
npx vitest run src/layout.test.ts
npx vitest run -t "renders empty state"
```

Before opening a PR, CONTRIBUTING.md asks for: `npm test && npm run typecheck && npm run build`.

`node scripts/capture-demo.mjs` regenerates `docs/sphere-graph-tasks-dark.png` (needs `npm run dev` running and Playwright installed; override the URL with `DEMO_URL`).

## Architecture

This is a published npm library (`sphere-graph`), not an app. `src/index.ts` is the **public API surface** — anything exported there is covered by the semver policy from v1.0.0 onward. The library ships ESM only, with React as a peer dependency, and CSS that consumers must import explicitly (`sphere-graph/style.css`); it is never injected.

The core idea: force-directed layouts collapse dense graphs into a hairball, so this library places nodes deterministically on a sphere and draws edges *only for the focused node*. Two consequences run through the whole codebase — there is no simulation/tick loop to tune, and edge rendering is always a function of one focus id.

**Layer 1 — pure, React-free primitives.** `layout.ts` → `project.ts` → `graph.ts` form the pipeline:

- `layoutOnSphere(nodes)` buckets nodes by `group` (order of first appearance), gives each group an equal longitude wedge, and packs each wedge with `fibonacciWedge` (or the whole sphere with `fibonacciSphere` when there's a single group). Multi-group layouts pad the poles because longitude is meaningless at y=±1 and groups would collide there.
- `project(points, camera)` applies yaw/pitch rotation + perspective, drops points behind the camera, and returns them sorted far-to-near (painter's algorithm — there is no z-buffer, so render order *is* the sort order).
- `graph.ts` derives degree/adjacency and the directed focus helpers. `directed: true` means the edge appears only as outgoing on `source` and incoming on `target`; undirected edges appear on both endpoints in both maps.

These are exported deliberately so hosts can render with canvas/WebGL/SSR instead of the React component. Keep them free of React and DOM imports.

**Layer 2 — supporting pure modules**, each with a matching `*.test.ts`: `search.ts` (weighted `matchScore` across label/description/tags/group/id), `filter.ts` (group + edge-kind filters; `buildFilteredGraph` also drops edges whose endpoints were filtered out), `sanitize.ts` (dedupe node ids, drop edges pointing at missing nodes, dev-only `console.warn`), `edgeWeight.ts` (normalize edge weight → stroke width), `deeplink.ts`.

**Layer 3 — `SphereGraph.tsx`** is the only React file, and the only stateful one. It composes the layers above through `useMemo` chains (sanitize → layout → project), owns camera state (yaw/pitch/distance, auto-spin, drag/wheel), focus state, keyboard navigation, and the SVG markup. Every visual prop resolves against `--sg-*` CSS variables in `src/sphere-graph.css`, keyed off `data-theme` on the root element.

Several props are **optionally controlled**, and the detection rule differs per prop — match the existing pattern when adding more:
- pin: controlled when `onPinnedIdChange` is provided (not when `pinnedId` is).
- search: controlled when `searchQuery !== undefined`.

Focus is `hovered ?? selected`, so hover transiently overrides the pin without clearing it.

## Conventions

- New public exports go in `src/index.ts` and need a CHANGELOG entry; adding one is a **minor** bump, changing/removing one is **major**.
- New behavior in a pure module belongs in that module with a sibling `*.test.ts`, not inlined into `SphereGraph.tsx`.
- `demo/` is dev-only and excluded from the published package via the `files` allowlist — it imports from `../src`, so it doubles as a type check against the real source.
- tsup emits no declarations (its bundled `rollup-plugin-dts` is incompatible with the pinned TypeScript); `tsc -p tsconfig.build.json` emits them instead. Don't flip `dts: true` in `tsup.config.ts`.
- TS is strict with `noUnusedLocals`/`noUnusedParameters` and `verbatimModuleSyntax` — use `import type` for type-only imports.
- Tests run under jsdom; `vitest.setup.ts` stubs `window.matchMedia` (the component reads `prefers-reduced-motion`).

## Branching and release

PRs target **`develop`**, not `main` (exceptions: release PRs and hotfixes off `main`). Don't bump `package.json` or tag from `develop`. Releases merge `develop` → `main`, bump the version + CHANGELOG, then a pushed `vX.Y.Z` tag triggers npm publish via Trusted Publishing. Full details, including the worktree layout and hotfix flow, are in CONTRIBUTING.md.
