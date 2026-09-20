import { getDatabase } from '@/db/database';
import { enrichVocabularyWithExamples } from '@/features/vocabulary/repositories/vocabularyRepository';
import type { ReviewCard, ReviewState } from '@/features/review/types';
import type { Vocabulary } from '@/features/vocabulary/types';

type ReviewRow = {
  vocabulary_id: string;
  review_level: number;
  correct_count: number;
  incorrect_count: number;
  next_review_at: string;
};

type DueReviewRow = ReviewRow & {
  id: string;
  arabic_word: string;
  meaning: string;
  description: string | null;
  image_uri: string | null;
  created_at: string;
  updated_at: string;
};

function mapReviewRow(row: ReviewRow): ReviewState {
  return {
    vocabularyId: row.vocabulary_id,
    reviewLevel: row.review_level,
    correctCount: row.correct_count,
    incorrectCount: row.incorrect_count,
    nextReviewAt: row.next_review_at,
  };
}

function mapDueReviewRow(row: DueReviewRow): ReviewCard {
  const vocabulary: Vocabulary = {
    id: row.id,
    arabicWord: row.arabic_word,
    meaning: row.meaning,
    examples: [],
    description: row.description ?? undefined,
    imageUri: row.image_uri ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  return {
    vocabulary,
    review: mapReviewRow(row),
  };
}

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

export async function countDueReviews(nowIso: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM vocabulary_review
     WHERE datetime(next_review_at) <= datetime(?);`,
    nowIso,
  );
  return row?.count ?? 0;
}

export async function findDueReviewCards(nowIso: string): Promise<ReviewCard[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DueReviewRow>(
    `SELECT
       v.id,
       v.arabic_word,
       v.meaning,
       v.description,
       v.image_uri,
       v.created_at,
       v.updated_at,
       r.vocabulary_id,
       r.review_level,
       r.correct_count,
       r.incorrect_count,
       r.next_review_at
     FROM vocabulary_review r
     INNER JOIN vocabulary v ON v.id = r.vocabulary_id
     WHERE datetime(r.next_review_at) <= datetime(?)
     ORDER BY datetime(r.next_review_at) ASC;`,
    nowIso,
  );

  const cards = rows.map(mapDueReviewRow);
  const enrichedVocabulary = await enrichVocabularyWithExamples(
    cards.map((card) => card.vocabulary),
  );

  return cards.map((card, index) => ({
    ...card,
    vocabulary: enrichedVocabulary[index] ?? card.vocabulary,
  }));
}

export async function updateReviewState(state: ReviewState): Promise<void> {
  const db = await getDatabase();

  const result = await db.runAsync(
    `UPDATE vocabulary_review
     SET review_level = ?,
         correct_count = ?,
         incorrect_count = ?,
         next_review_at = ?
     WHERE vocabulary_id = ?;`,
    state.reviewLevel,
    state.correctCount,
    state.incorrectCount,
    state.nextReviewAt,
    state.vocabularyId,
  );

  if (result.changes === 0) {
    throw new Error('Review state not found', { cause: { vocabularyId: state.vocabularyId } });
  }
}

export async function findReviewStateByVocabularyId(
  vocabularyId: string,
): Promise<ReviewState | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ReviewRow>(
    'SELECT * FROM vocabulary_review WHERE vocabulary_id = ? LIMIT 1;',
    vocabularyId,
  );
  return row ? mapReviewRow(row) : null;
}
