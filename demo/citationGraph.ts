import type { SphereGraphEdge, SphereGraphNode } from "../src/types";

/** Mini citation corpus — economics papers with weighted citation edges. */
export const citationGroupLabels: Record<string, string> = {
  trade: "International trade",
  network: "Network economics",
  empirics: "Empirical IO",
};

export const citationGroupColors: Record<string, string> = {
  trade: "#30d158",
  network: "#0a84ff",
  empirics: "#ff9f0a",
};

export const citationNodes: SphereGraphNode[] = [
  {
    id: "krugman-79",
    label: "Krugman (1979)",
    group: "trade",
    description: "Increasing returns and monopolistic competition in trade",
    tags: ["theory", "trade"],
  },
  {
    id: "eaton-kortum",
    label: "Eaton & Kortum (2002)",
    group: "trade",
    description: "Technology, geography, and trade — Ricardian model",
    tags: ["theory", "trade", "empirics"],
  },
  {
    id: "jackson-08",
    label: "Jackson (2008)",
    group: "network",
    description: "Social and Economic Networks — textbook overview",
    tags: ["theory", "network"],
  },
  {
    id: "goyal-07",
    label: "Goyal (2007)",
    group: "network",
    description: "Connections — strategic network formation",
    tags: ["theory", "network"],
  },
  {
    id: "bernard-07",
    label: "Bernard et al. (2007)",
    group: "empirics",
    description: "Firms in international trade — micro data",
    tags: ["empirics", "trade"],
  },
  {
    id: "athey-18",
    label: "Athey et al. (2018)",
    group: "empirics",
    description: "The impact of machine learning on economics",
    tags: ["empirics", "methods"],
  },
  {
    id: "granovetter",
    label: "Granovetter (1973)",
    group: "network",
    description: "Strength of weak ties",
    tags: ["theory", "network", "sociology"],
  },
  {
    id: "melitz-03",
    label: "Melitz (2003)",
    group: "trade",
    description: "Heterogeneous firms and trade",
    tags: ["theory", "trade"],
  },
];

export const citationEdges: SphereGraphEdge[] = [
  { source: "krugman-79", target: "melitz-03", kind: "citation", directed: true, weight: 3 },
  { source: "melitz-03", target: "bernard-07", kind: "citation", directed: true, weight: 5 },
  { source: "eaton-kortum", target: "bernard-07", kind: "citation", directed: true, weight: 4 },
  { source: "krugman-79", target: "eaton-kortum", kind: "citation", directed: true, weight: 2 },
  { source: "jackson-08", target: "goyal-07", kind: "citation", directed: true, weight: 3 },
  { source: "goyal-07", target: "granovetter", kind: "reference", directed: true, weight: 1 },
  { source: "jackson-08", target: "granovetter", kind: "reference", directed: true, weight: 2 },
  { source: "athey-18", target: "bernard-07", kind: "citation", directed: true, weight: 1 },
  { source: "athey-18", target: "jackson-08", kind: "citation", directed: true, weight: 1 },
  { source: "melitz-03", target: "eaton-kortum", kind: "citation", directed: true, weight: 2 },
];
