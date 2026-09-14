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

function priorityRank(c: LabelCandidate): number {
  if (c.isFocus) return 0;
  if (c.isNeighbor) return 1;
  if (c.isSearchMatch) return 2;
  return 3;
}

/**
 * Orders candidates focus > neighbor > search match > weight, with ties
 * broken by input order — pass candidates near-first (the reverse of
 * `project`'s far-to-near sort) so front-most nodes win ties for free.
 * Shared by both the budget (`selectVisibleLabels`) and collision
 * (`rejectOverlappingLabels`) stages so "priority order" means the same
 * thing in both.
 */
export function orderByPriority<T extends LabelCandidate>(candidates: readonly T[]): T[] {
  return candidates
    .map((candidate, index) => ({ candidate, index }))
    .sort((a, b) => {
      const rankDiff = priorityRank(a.candidate) - priorityRank(b.candidate);
      if (rankDiff !== 0) return rankDiff;
      const weightDiff = b.candidate.weight - a.candidate.weight;
      if (weightDiff !== 0) return weightDiff;
      return a.index - b.index;
    })
    .map(({ candidate }) => candidate);
}

/**
 * Selects which candidates get a label, ranked by `orderByPriority`.
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
  let remainingBudget = budget;
  for (const candidate of orderByPriority(candidates)) {
    const exempt = candidate.isFocus || candidate.isNeighbor;
    if (!exempt && remainingBudget <= 0) continue;
    admitted.add(candidate.id);
    remainingBudget--;
  }

  return admitted;
}

/** A label candidate with its on-screen anchor point (label box center). */
export interface PositionedLabelCandidate extends LabelCandidate {
  centerX: number;
  centerY: number;
}

interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function boxRect(c: PositionedLabelCandidate): Rect {
  const box = estimateLabelBox(c.label);
  return {
    left: c.centerX - box.width / 2,
    right: c.centerX + box.width / 2,
    top: c.centerY - box.height / 2,
    bottom: c.centerY + box.height / 2,
  };
}

function intersects(a: Rect, b: Rect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/**
 * Greedy collision rejection: walk candidates in priority order (see
 * `orderByPriority`), keeping each whose box doesn't intersect an
 * already-placed one. Focus and its neighbors are exempt — always placed
 * regardless of collisions.
 *
 * Uses a uniform grid, cell-sized to the largest box in the set, so each
 * candidate only checks its own 3x3 neighborhood instead of every
 * previously-placed box — near-linear instead of O(n^2).
 */
export function rejectOverlappingLabels(
  candidates: readonly PositionedLabelCandidate[],
): Set<string> {
  if (candidates.length === 0) return new Set();

  const ordered = orderByPriority(candidates);
  const cellSize = ordered.reduce((max, c) => {
    const box = estimateLabelBox(c.label);
    return Math.max(max, box.width, box.height);
  }, 1);

  const grid = new Map<string, Rect[]>();
  const cellOf = (value: number) => Math.floor(value / cellSize);
  const keyOf = (cx: number, cy: number) => `${cx}:${cy}`;

  const admitted = new Set<string>();
  for (const candidate of ordered) {
    const rect = boxRect(candidate);
    const cx = cellOf(candidate.centerX);
    const cy = cellOf(candidate.centerY);

    if (!candidate.isFocus && !candidate.isNeighbor) {
      let collides = false;
      for (let dx = -1; dx <= 1 && !collides; dx++) {
        for (let dy = -1; dy <= 1 && !collides; dy++) {
          const bucket = grid.get(keyOf(cx + dx, cy + dy));
          if (bucket?.some((placed) => intersects(rect, placed))) collides = true;
        }
      }
      if (collides) continue;
    }

    admitted.add(candidate.id);
    const key = keyOf(cx, cy);
    const bucket = grid.get(key);
    if (bucket) bucket.push(rect);
    else grid.set(key, [rect]);
  }

  return admitted;
}
