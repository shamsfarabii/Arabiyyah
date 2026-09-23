import type { ReviewSelectionCandidate } from '@/features/review/types';

function compareReviewPriority(a: ReviewSelectionCandidate, b: ReviewSelectionCandidate): number {
  const aUnknown = a.lastResult === 'unknown';
  const bUnknown = b.lastResult === 'unknown';

  if (aUnknown !== bUnknown) {
    return aUnknown ? -1 : 1;
  }

  if (aUnknown && bUnknown) {
    const aTime = a.lastReviewedAt ?? '';
    const bTime = b.lastReviewedAt ?? '';
    return bTime.localeCompare(aTime);
  }

  if (a.everReviewed !== b.everReviewed) {
    return a.everReviewed ? 1 : -1;
  }

  if (!a.everReviewed && !b.everReviewed) {
    return 0;
  }

  const aTime = a.lastReviewedAt ?? '';
  const bTime = b.lastReviewedAt ?? '';
  return aTime.localeCompare(bTime);
}

/**
 * Picks unique vocabulary ids for a daily review, without replacement.
 */
export function selectReviewVocabulary(
  candidates: readonly ReviewSelectionCandidate[],
  cardCount: number,
): string[] {
  const requested = Math.floor(cardCount);
  if (!Number.isFinite(requested) || requested <= 0 || candidates.length === 0) {
    return [];
  }

  const sorted = [...candidates].sort(compareReviewPriority);
  return sorted.slice(0, Math.min(requested, sorted.length)).map((item) => item.vocabularyId);
}
