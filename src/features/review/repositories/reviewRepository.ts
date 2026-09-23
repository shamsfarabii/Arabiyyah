import { getDatabase } from '@/db/database';

/**
 * The card-flipping Review screen was replaced by the quiz, but every word
 * still gets its spaced-repetition row so the existing `vocabulary_review`
 * data stays complete and usable for scheduling work later.
 */
export async function insertInitialReviewState(
  vocabularyId: string,
  nextReviewAt: string,
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `INSERT INTO vocabulary_review (
      vocabulary_id,
      review_level,
      correct_count,
      incorrect_count,
      next_review_at
    ) VALUES (?, 0, 0, 0, ?);`,
    vocabularyId,
    nextReviewAt,
  );
}
