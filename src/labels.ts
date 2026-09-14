/** A node label competing for a spot in the on-screen label budget. */
export interface LabelCandidate {
  id: string;
  label: string;
  isFocus: boolean;
  isNeighbor: boolean;
  isSearchMatch: boolean;
  weight: number;
}

/** Estimated on-screen box for a label at a given font size, in px^2. */
export interface LabelBoxEstimate {
  width: number;
  height: number;
}

const AVG_CHAR_WIDTH_RATIO = 0.6;
const LINE_HEIGHT_RATIO = 1.4;

/**
 * Character-count based box estimate. Deliberately avoids getBBox /
 * getComputedTextLength, which force synchronous layout — this needs to
 * run for every candidate, every render.
 */
export function estimateLabelBox(label: string, fontSize = 11): LabelBoxEstimate {
  // Floor at 1 char so an empty label doesn't collapse the box to zero
  // area, which would zero out the whole budget (see computeLabelBudget).
  const charCount = Math.max(1, label.length);
  return {
    width: charCount * fontSize * AVG_CHAR_WIDTH_RATIO,
    height: fontSize * LINE_HEIGHT_RATIO,
  };
}

/**
 * How many labels of the given average box area fit in a viewport of this
 * size. Replaces a fixed node-count threshold with a real budget derived
 * from viewport area and label size.
 */
export function computeLabelBudget(
  viewportWidth: number,
  viewportHeight: number,
  avgBoxArea: number,
): number {
  if (avgBoxArea <= 0) return 0;
  return Math.max(0, Math.floor((viewportWidth * viewportHeight) / avgBoxArea));
}

/**
 * Selects which candidates get a label, ranked focus > neighbor > search
 * match > weight, with ties broken by `candidates` order — pass candidates
 * near-first (the reverse of `project`'s far-to-near sort) so front-most
 * nodes win ties for free.
 *
 * Focus and its neighbors are always admitted regardless of budget, so
 * focus-highlight UX never degrades under a tight budget.
 */
export function selectVisibleLabels(
  candidates: readonly LabelCandidate[],
  viewportWidth: number,
  viewportHeight: number,
): Set<string> {
  if (candidates.length === 0) return new Set();

  const avgBoxArea =
    candidates.reduce((sum, c) => {
      const box = estimateLabelBox(c.label);
      return sum + box.width * box.height;
    }, 0) / candidates.length;
  const budget = computeLabelBudget(viewportWidth, viewportHeight, avgBoxArea);

  const admitted = new Set<string>();
  const rest: { candidate: LabelCandidate; index: number }[] = [];
  candidates.forEach((candidate, index) => {
    if (candidate.isFocus || candidate.isNeighbor) {
      admitted.add(candidate.id);
    } else {
      rest.push({ candidate, index });
    }
  });

  const remainingBudget = Math.max(0, budget - admitted.size);
  rest
    .sort((a, b) => {
      const searchDiff = Number(b.candidate.isSearchMatch) - Number(a.candidate.isSearchMatch);
      if (searchDiff !== 0) return searchDiff;
      const weightDiff = b.candidate.weight - a.candidate.weight;
      if (weightDiff !== 0) return weightDiff;
      return a.index - b.index;
    })
    .slice(0, remainingBudget)
    .forEach(({ candidate }) => admitted.add(candidate.id));

  return admitted;
}
