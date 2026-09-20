import {
  AGAIN_REVIEW_DAYS,
  REVIEW_INTERVALS_IN_DAYS,
} from '@/features/review/constants/reviewIntervals';
import {
  findDueReviewCards,
  findReviewStateByVocabularyId,
  updateReviewState,
} from '@/features/review/repositories/reviewRepository';
import type { ReviewCard } from '@/features/review/types';
import { addDays, toIsoNow } from '@/utils/dates';

export async function getDueReviewCards(): Promise<ReviewCard[]> {
  return findDueReviewCards(toIsoNow());
}

export async function recordAgain(vocabularyId: string): Promise<void> {
  const review = await findReviewStateByVocabularyId(vocabularyId);
  if (!review) {
    throw new Error('Review state not found', { cause: { vocabularyId } });
  }

  const nowIso = toIsoNow();
  const nextLevel = Math.max(review.reviewLevel - 1, 0);

  await updateReviewState({
    ...review,
    reviewLevel: nextLevel,
    incorrectCount: review.incorrectCount + 1,
    nextReviewAt: addDays(nowIso, AGAIN_REVIEW_DAYS),
  });
}

export async function recordKnow(vocabularyId: string): Promise<void> {
  const review = await findReviewStateByVocabularyId(vocabularyId);
  if (!review) {
    throw new Error('Review state not found', { cause: { vocabularyId } });
  }

  const nowIso = toIsoNow();
  const maxIndex = REVIEW_INTERVALS_IN_DAYS.length - 1;
  const intervalIndex = Math.min(Math.max(review.reviewLevel, 0), maxIndex);
  const intervalDays = REVIEW_INTERVALS_IN_DAYS[intervalIndex];
  const nextLevel = Math.min(review.reviewLevel + 1, maxIndex);

  await updateReviewState({
    ...review,
    reviewLevel: nextLevel,
    correctCount: review.correctCount + 1,
    nextReviewAt: addDays(nowIso, intervalDays),
  });
}
