# Changelog

All notable changes to this project are documented here. Version bumps and npm
releases happen when `develop` is merged to `main` and a matching `vX.Y.Z` tag
is pushed.

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

[0.3.0]: https://github.com/burakcebecioglu/sphere-graph/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/burakcebecioglu/sphere-graph/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/burakcebecioglu/sphere-graph/releases/tag/v0.1.0
