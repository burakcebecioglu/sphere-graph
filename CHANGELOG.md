# Changelog

All notable changes to this project are documented here. Version bumps and npm
releases happen when `develop` is merged to `main` and a matching `vX.Y.Z` tag
is pushed.

## [1.0.1] - 2026-09-14

Patch release fixing label legibility and dark-theme focus dimming, found at
~150 nodes in a real consumer app. No public API changes.

- Fix the label LOD gate never thinning labels: its scale-based threshold was
  unreachable at every camera distance, so every label always rendered
- Replace the fixed node-count label threshold with a screen-space budget
  derived from viewport size and label length, ranked by focus/neighbor/search
  match/weight, with focus and neighbors always exempt
- Reject overlapping labels with greedy collision detection so admitted
  labels never overlap on screen
- Raise the dim-opacity floor on the dark theme so unfocused/non-matching
  nodes stay visible as structure instead of disappearing into the canvas
- Add `src/labels.ts`, a pure module for label selection, with full test
  coverage including a 150-node regression test
- Demo: add a 150-node dense-label dataset and a 90-node Jira-style
  task-dependency dataset; update the README screenshot

## [1.0.0] - 2026-08-29

Stable release for single-sphere knowledge graph exploration.

- Add node metadata: `description`, `tags` (searchable)
- Add `initialPinnedId` for deep-linking on mount
- Sanitize invalid graphs: empty state, skip bad edges, dedupe duplicate ids (dev warnings)
- Search: `searchQuery`, built-in search bar, dim non-matches, `searchNodes` / `matchScore` helpers
- Filter: `visibleGroups`, `visibleEdgeKinds`, `buildFilteredGraph` and related helpers
- Optional `showSecondHop` for neighbors-of-neighbors on focus
- Responsive `fitParent` with ResizeObserver
- Edge `weight` maps to focus-edge stroke width; `computeEdgeWeightRange` / `edgeStrokeWidth`
- Label LOD when node count exceeds threshold
- Keyboard navigation (Tab, arrow keys, Enter, Escape, `/`) and ARIA labels / live region
- Deep-link helper: `focusIdFromSearchParam`
- Render hooks: `renderNode`, `renderNodeLabel`
- React interaction tests (Vitest + Testing Library)
- Demo: book graph, citation corpus, search/filters/responsive toggles

## [0.3.0] - 2026-08-29

- Add optional `kind` and `directed` fields on edges
- Expose incoming/outgoing focus links (`SphereGraphFocus.outgoing` / `.incoming`)
- Style focus edges: solid, dashed (reference), arrows (directed/cause)
- Add controlled pin props (`pinnedId`, `onPinnedIdChange`)
- Add graph helpers: `buildOutgoing`, `buildIncoming`, `focusLinks`, `neighborsForFocus`
- Replace demo with 3-chapter book dataset; update README screenshot

## [0.2.0] - 2026-08-21

- Add light/dark/system theming via `theme` prop and `--sg-*` CSS variables

## [0.1.0] - 2026-08-20

- Initial release: Fibonacci sphere layout, React SVG viewer, focus-only edges

[1.0.1]: https://github.com/burakcebecioglu/sphere-graph/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/burakcebecioglu/sphere-graph/compare/v0.3.0...v1.0.0
[0.3.0]: https://github.com/burakcebecioglu/sphere-graph/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/burakcebecioglu/sphere-graph/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/burakcebecioglu/sphere-graph/releases/tag/v0.1.0
