import type { SphereGraphEdge, SphereGraphNode } from "../src/types";

export const bookGroupLabels: Record<string, string> = {
  ch1: "Chapter 1: Departure",
  ch2: "Chapter 2: Crossing",
  ch3: "Chapter 3: Return",
};

export const bookGroupColors: Record<string, string> = {
  ch1: "#30d158",
  ch2: "#0a84ff",
  ch3: "#bf5af2",
};

export const bookNodes: SphereGraphNode[] = [
  {
    id: "ch1-open",
    label: "Opening scene",
    group: "ch1",
    description: "The village at dawn before the journey begins",
    tags: ["narrative"],
  },
  {
    id: "ch1-meet",
    label: "Meet the guide",
    group: "ch1",
    description: "A stranger offers passage across the mountains",
    tags: ["character"],
  },
  {
    id: "ch1-storm",
    label: "The storm",
    group: "ch1",
    description: "Thunder forces the party to shelter in the ruins",
    tags: ["conflict"],
  },
  {
    id: "ch1-choice",
    label: "Leave the village",
    group: "ch1",
    description: "The protagonist commits to leaving home",
    tags: ["turning-point"],
  },
  {
    id: "ch1-map",
    label: "Hidden map",
    group: "ch1",
    description: "A folded chart reveals a route through the pass",
    tags: ["mystery"],
  },
  {
    id: "ch2-arrival",
    label: "River crossing",
    group: "ch2",
    description: "The ferryman demands a toll no one expected",
    tags: ["transition"],
  },
  {
    id: "ch2-secret",
    label: "Secret council",
    group: "ch2",
    description: "City elders debate whether to admit refugees",
    tags: ["politics"],
  },
  {
    id: "ch2-betrayal",
    label: "The betrayal",
    group: "ch2",
    description: "An ally sells the party's location",
    tags: ["conflict", "turning-point"],
  },
  {
    id: "ch2-escape",
    label: "Escape the city",
    group: "ch2",
    description: "A rooftop chase through the lantern district",
    tags: ["action"],
  },
  {
    id: "ch2-ally",
    label: "Unexpected ally",
    group: "ch2",
    description: "The ferryman's daughter opens a hidden gate",
    tags: ["character"],
  },
  {
    id: "ch3-reunion",
    label: "Reunion at dawn",
    group: "ch3",
    description: "Survivors gather at the ridge overlooking home",
    tags: ["narrative"],
  },
  {
    id: "ch3-truth",
    label: "Truth revealed",
    group: "ch3",
    description: "The guide explains why the map was hidden",
    tags: ["mystery", "turning-point"],
  },
  {
    id: "ch3-finale",
    label: "Final choice",
    group: "ch3",
    description: "Return to the village or continue beyond the pass",
    tags: ["turning-point"],
  },
  {
    id: "ch3-echo",
    label: "Echo of ch1",
    group: "ch3",
    description: "The opening melody returns on a different instrument",
    tags: ["reference"],
  },
];

export const bookEdges: SphereGraphEdge[] = [
  { source: "ch1-open", target: "ch1-meet", kind: "sequential", directed: true, weight: 2 },
  { source: "ch1-meet", target: "ch1-storm", kind: "sequential", directed: true, weight: 2 },
  { source: "ch1-storm", target: "ch1-choice", kind: "sequential", directed: true, weight: 3 },
  { source: "ch1-meet", target: "ch1-map", kind: "sequential", directed: true, weight: 1 },
  { source: "ch1-map", target: "ch1-choice", kind: "sequential", directed: true, weight: 2 },
  { source: "ch1-open", target: "ch1-choice", kind: "sequential", directed: true, weight: 1 },

  { source: "ch2-arrival", target: "ch2-secret", kind: "sequential", directed: true, weight: 2 },
  { source: "ch2-secret", target: "ch2-betrayal", kind: "sequential", directed: true, weight: 3 },
  { source: "ch2-betrayal", target: "ch2-escape", kind: "sequential", directed: true, weight: 3 },
  { source: "ch2-secret", target: "ch2-ally", kind: "sequential", directed: true, weight: 1 },
  { source: "ch2-ally", target: "ch2-escape", kind: "sequential", directed: true, weight: 2 },

  { source: "ch3-reunion", target: "ch3-truth", kind: "sequential", directed: true, weight: 2 },
  { source: "ch3-truth", target: "ch3-finale", kind: "sequential", directed: true, weight: 3 },
  { source: "ch3-reunion", target: "ch3-echo", kind: "sequential", directed: true, weight: 1 },
  { source: "ch3-echo", target: "ch3-finale", kind: "sequential", directed: true, weight: 2 },

  { source: "ch1-choice", target: "ch2-arrival", kind: "sequential", directed: true, weight: 2 },
  { source: "ch2-escape", target: "ch3-reunion", kind: "sequential", directed: true, weight: 2 },
  { source: "ch3-truth", target: "ch1-meet", kind: "reference", directed: true, weight: 1 },
  { source: "ch2-betrayal", target: "ch3-truth", kind: "cause", directed: true, weight: 3 },
  { source: "ch1-map", target: "ch2-secret", kind: "reference", directed: true, weight: 1 },

  { source: "ch2-ally", target: "ch3-echo" },
];

export const bookEdgeKinds = ["sequential", "reference", "cause"] as const;
