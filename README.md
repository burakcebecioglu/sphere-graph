# sphere-graph

A framework-agnostic sphere layout, plus a React SVG component, for
rendering dense node-link graphs without the "hairball" a force-directed
layout produces.

![sphere-graph demo — nodes on a sphere with focus edges](docs/sphere-graph-demo.png)

## Why

Force-directed layouts (d3-force and friends) work well for sparse graphs.
Once a graph gets dense enough — every node linking to several others — the
physics collapses everything into an unreadable clump in the middle, no
matter how much you tune charge/collision.

`sphere-graph` sidesteps the physics: it places every node on a sphere with
guaranteed angular spacing (a Fibonacci lattice, optionally split into one
longitude wedge per group), then renders it with a simple orbit camera. You
get visible gaps between nodes at any graph size, with no simulation to
tune, and edges are only drawn for the focused node — drawing all of them at
once is unreadable even with perfect spacing.

## Install

```bash
npm install sphere-graph
```

## Usage

```tsx
import { SphereGraph } from "sphere-graph";
import "sphere-graph/style.css";

const nodes = [
  { id: "a", label: "A", group: "left" },
  { id: "b", label: "B", group: "right" },
  { id: "c", label: "C", group: "right" },
];

const edges = [
  { source: "a", target: "b" },
  { source: "b", target: "c" },
];

function Graph() {
  return (
    <SphereGraph
      nodes={nodes}
      edges={edges}
      groupColors={{ left: "#2a9d59", right: "#1a4fd6" }}
      onNodeActivate={(node) => console.log("open", node.id)}
      renderDetail={(focus) =>
        focus ? (
          <p>
            {focus.node.label} — {focus.neighbors.length} connections
          </p>
        ) : (
          <p>Hover a node</p>
        )
      }
    />
  );
}
```

## API

### `<SphereGraph />`

| Prop | Type | Description |
|---|---|---|
| `nodes` | `SphereGraphNode[]` | `{ id, label, group?, weight? }` |
| `edges` | `SphereGraphEdge[]` | `{ source, target }` |
| `groupColors` | `Record<string, string>` | Color per `group` value |
| `defaultColor` | `string` | Fallback color for ungrouped/unmapped nodes |
| `width` / `height` | `number` | SVG viewBox size (default `1100`×`780`) |
| `onNodeActivate` | `(node) => void` | Fires on double-click |
| `onFocusChange` | `(focus \| null) => void` | Fires whenever the hovered/pinned node changes |
| `renderDetail` | `(focus \| null) => ReactNode` | Renders the side panel; omit to hide it |

Interaction: drag to orbit, scroll to zoom, click a node to pin its focus,
double-click to activate it.

### Layout primitives (no React required)

```ts
import { layoutOnSphere, project, computeDegree, buildAdjacency, edgesForFocus } from "sphere-graph";
```

Use these directly to render the graph with your own renderer (canvas,
WebGL, a different SVG structure, a server-side snapshot, etc).

- `layoutOnSphere(nodes)` — places `{ id, group? }[]` on the unit sphere.
- `project(nodes, camera)` — rotates + perspective-projects 3D points to 2D, sorted far-to-near.
- `computeDegree` / `buildAdjacency` / `edgesForFocus` — derive weight, neighbors, and focus edges from a plain edge list.

## Local development

```bash
npm install
npm run dev    # tiny demo playground with fake data (not published)
npm run build  # emits dist/ (ESM + .d.ts + style.css)
```

## Contributing / releasing

CI (`.github/workflows/ci.yml`) typechecks and builds every push and pull
request. Releasing to npm is a separate, manually-triggered workflow
(`.github/workflows/release.yml`): pushing a `vX.Y.Z` tag builds the package
and publishes it. That workflow needs either npm Trusted Publishing
configured for this repo, or an `NPM_TOKEN` secret, before a tag push will
successfully publish — see the comments in that file.

## License

MIT
