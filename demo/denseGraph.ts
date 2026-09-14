import type { SphereGraphEdge, SphereGraphNode } from "../src/types";

/**
 * Regression fixture for SG-9/SG-10/SG-11: ~150 nodes with realistic
 * sentence-length labels across 5 groups. The other demo datasets (book,
 * citations, random) never reproduced the label-legibility bug — book and
 * citations are too small, and random's two-character labels ("N7") never
 * stressed label width or density. Label content is generated
 * deterministically (index-derived, no Math.random) so the fixture is
 * stable across runs.
 */

const GROUPS = ["recipes", "brewing", "equipment", "troubleshooting", "community"] as const;

export const denseGroupLabels: Record<string, string> = {
  recipes: "Recipes",
  brewing: "Brewing Techniques",
  equipment: "Equipment & Gear",
  troubleshooting: "Troubleshooting",
  community: "Community Notes",
};

export const denseGroupColors: Record<string, string> = {
  recipes: "#30d158",
  brewing: "#0a84ff",
  equipment: "#ff9f0a",
  troubleshooting: "#ff453a",
  community: "#bf5af2",
};

const SUBJECTS: Record<(typeof GROUPS)[number], string[]> = {
  recipes: ["Adjusting the recipe for", "A step-by-step guide to", "Fine-tuning the ratio for"],
  brewing: ["Dialing in the grind for", "Timing the extraction during", "Controlling the bloom in"],
  equipment: ["Choosing the right burrs for", "Calibrating the scale before", "Descaling the machine after"],
  troubleshooting: ["Diagnosing sour shots from", "Fixing channeling caused by", "Correcting uneven puck prep in"],
  community: ["A member's notes on", "A shared tasting log about", "Discussion thread covering"],
};

const DETAILS: Record<(typeof GROUPS)[number], string[]> = {
  recipes: ["a washed Ethiopian pour-over", "a dark-roast French press", "a low-acidity cold brew"],
  brewing: ["a fast espresso pull", "a slow immersion steep", "a high-altitude single origin"],
  equipment: ["a conical burr grinder", "a gooseneck kettle", "a bottomless portafilter"],
  troubleshooting: ["an over-extracted espresso", "a clogged basket", "an inconsistent tamp"],
  community: ["a home roasting experiment", "a competition prep routine", "a beginner's first pour-over"],
};

const QUALIFIERS = [
  "during humid weather",
  "with a fresh bag of beans",
  "on a budget setup",
  "for a morning routine",
  "after switching water filters",
  "for a two-cup batch",
];

function group(index: number): (typeof GROUPS)[number] {
  return GROUPS[index % GROUPS.length]!;
}

function makeLabel(index: number, g: (typeof GROUPS)[number]): string {
  const subject = SUBJECTS[g][index % SUBJECTS[g].length]!;
  const detail = DETAILS[g][(index * 7) % DETAILS[g].length]!;
  const qualifier = QUALIFIERS[(index * 13) % QUALIFIERS.length]!;
  return `${subject} ${detail} ${qualifier}`;
}

const DENSE_NODE_COUNT = 150;

export const denseNodes: SphereGraphNode[] = Array.from({ length: DENSE_NODE_COUNT }, (_, i) => {
  const g = group(i);
  return {
    id: `dense-${i}`,
    label: makeLabel(i, g),
    group: g,
    weight: 1 + (i % 5),
  };
});

export const denseEdges: SphereGraphEdge[] = (() => {
  const edges: SphereGraphEdge[] = [];
  for (let i = 0; i < DENSE_NODE_COUNT; i++) {
    // Chain each node to the next in the same group so every group forms a
    // connected, focusable neighborhood.
    const next = i + GROUPS.length;
    if (next < DENSE_NODE_COUNT) {
      edges.push({ source: `dense-${i}`, target: `dense-${next}`, kind: "related", directed: true });
    }
    // Sparse cross-group links so focus/neighbor highlighting has to cope
    // with nodes scattered across the sphere, not just one local cluster.
    if (i % 11 === 0) {
      const target = (i + 37) % DENSE_NODE_COUNT;
      if (target !== i) {
        edges.push({ source: `dense-${i}`, target: `dense-${target}`, kind: "cross-reference" });
      }
    }
  }
  return edges;
})();

export const denseEdgeKinds = ["related", "cross-reference"] as const;
