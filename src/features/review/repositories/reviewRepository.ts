import { getDatabase } from '@/db/database';
import type { AppDatabase } from '@/db/types';
import { reviewSessionPlanSchema } from '@/features/review/schemas/reviewSchema';
import type {
  ReviewAttempt,
  ReviewResult,
  ReviewSelectionCandidate,
  ReviewSession,
  ReviewSessionPlanItem,
} from '@/features/review/types';
type SessionRow = {
  id: string;
  started_at: string;
  completed_at: string | null;
  plan_json: string;
};

type SelectionRow = {
  vocabulary_id: string;
  last_reviewed_at: string | null;
  last_result: ReviewResult | null;
  ever_reviewed: number;
};

type AttemptRow = {
  id: string;
  session_id: string;
  vocabulary_id: string;
  result: ReviewResult;
  review_direction: ReviewSessionPlanItem['reviewDirection'];
  reviewed_at: string;
};

function mapSessionRow(row: SessionRow): ReviewSession {
  const plan = reviewSessionPlanSchema.parse(JSON.parse(row.plan_json));
  return {
    id: row.id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    plan,
  };
}

function mapAttemptRow(row: AttemptRow): ReviewAttempt {
  return {
    id: row.id,
    sessionId: row.session_id,
    vocabularyId: row.vocabulary_id,
    result: row.result,
    reviewDirection: row.review_direction,
    reviewedAt: row.reviewed_at,
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

export async function findIncompleteReviewSession(
  db: AppDatabase,
): Promise<ReviewSession | null> {
  const row = await db.getFirstAsync<SessionRow>(
    `SELECT id, started_at, completed_at, plan_json
     FROM review_session
     WHERE completed_at IS NULL
     ORDER BY datetime(started_at) DESC
     LIMIT 1;`,
  );

  return row ? mapSessionRow(row) : null;
}

export async function findReviewSessionById(
  db: AppDatabase,
  sessionId: string,
): Promise<ReviewSession | null> {
  const row = await db.getFirstAsync<SessionRow>(
    `SELECT id, started_at, completed_at, plan_json
     FROM review_session
     WHERE id = ?
     LIMIT 1;`,
    sessionId,
  );

  return row ? mapSessionRow(row) : null;
}

export async function insertReviewSession(
  db: AppDatabase,
  session: ReviewSession,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO review_session (
      id,
      started_at,
      completed_at,
      plan_json
    ) VALUES (?, ?, ?, ?);`,
    session.id,
    session.startedAt,
    session.completedAt,
    JSON.stringify(session.plan),
  );
}

export async function markReviewSessionCompleted(
  db: AppDatabase,
  sessionId: string,
  completedAt: string,
): Promise<void> {
  await db.runAsync(
    `UPDATE review_session
     SET completed_at = ?
     WHERE id = ?
       AND completed_at IS NULL;`,
    completedAt,
    sessionId,
  );
}

export async function findAttemptsForSession(
  db: AppDatabase,
  sessionId: string,
): Promise<ReviewAttempt[]> {
  const rows = await db.getAllAsync<AttemptRow>(
    `SELECT
       id,
       session_id,
       vocabulary_id,
       result,
       review_direction,
       reviewed_at
     FROM review_attempt
     WHERE session_id = ?
     ORDER BY datetime(reviewed_at) ASC;`,
    sessionId,
  );

  return rows.map(mapAttemptRow);
}

export async function insertReviewAttempt(
  db: AppDatabase,
  attempt: ReviewAttempt,
): Promise<{ inserted: boolean }> {
  const result = await db.runAsync(
    `INSERT INTO review_attempt (
      id,
      session_id,
      vocabulary_id,
      result,
      review_direction,
      reviewed_at
    ) VALUES (?, ?, ?, ?, ?, ?);`,
    attempt.id,
    attempt.sessionId,
    attempt.vocabularyId,
    attempt.result,
    attempt.reviewDirection,
    attempt.reviewedAt,
  );

  return { inserted: result.changes > 0 };
}

export async function countQuizEligibleVocabulary(db: AppDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(DISTINCT v.id) AS count
     FROM vocabulary v
     WHERE EXISTS (
       SELECT 1
       FROM review_attempt ra
       WHERE ra.vocabulary_id = v.id
     );`,
  );

  return row?.count ?? 0;
}

export async function findReviewSelectionCandidates(
  db: AppDatabase,
): Promise<ReviewSelectionCandidate[]> {
  const rows = await db.getAllAsync<SelectionRow>(
    `SELECT
       v.id AS vocabulary_id,
       latest.reviewed_at AS last_reviewed_at,
       latest.result AS last_result,
       CASE WHEN latest.vocabulary_id IS NULL THEN 0 ELSE 1 END AS ever_reviewed
     FROM vocabulary v
     LEFT JOIN (
       SELECT
         ra.vocabulary_id,
         ra.reviewed_at,
         ra.result
       FROM review_attempt ra
       INNER JOIN (
         SELECT vocabulary_id, MAX(datetime(reviewed_at)) AS max_reviewed_at
         FROM review_attempt
         GROUP BY vocabulary_id
       ) grouped
         ON grouped.vocabulary_id = ra.vocabulary_id
        AND datetime(ra.reviewed_at) = grouped.max_reviewed_at
     ) latest
       ON latest.vocabulary_id = v.id
     ORDER BY datetime(v.created_at) ASC;`,
  );

  return rows.map((row) => ({
    vocabularyId: row.vocabulary_id,
    lastReviewedAt: row.last_reviewed_at,
    lastResult: row.last_result,
    everReviewed: row.ever_reviewed !== 0,
  }));
}
