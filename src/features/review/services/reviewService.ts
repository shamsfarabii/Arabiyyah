import { getDatabase } from '@/db/database';
import type { AppDatabase } from '@/db/types';
import {
  countQuizEligibleVocabulary,
  findAttemptsForSession,
  findIncompleteReviewSession,
  findReviewSelectionCandidates,
  findReviewSessionById,
  insertReviewAttempt,
  insertReviewSession,
  markReviewSessionCompleted,
} from '@/features/review/repositories/reviewRepository';
import { reviewAttemptSubmissionSchema } from '@/features/review/schemas/reviewSchema';
import { ReviewError } from '@/features/review/services/reviewErrors';
import type {
  ActiveReviewSession,
  ReviewCard,
  ReviewHomeState,
  ReviewSession,
  ReviewSessionPlanItem,
} from '@/features/review/types';
import { assignReviewDirections } from '@/features/review/utils/assignReviewDirections';
import { selectReviewVocabulary } from '@/features/review/utils/selectReviewVocabulary';
import { countVocabulary, findVocabularyByIds } from '@/features/vocabulary/repositories/vocabularyRepository';
import { createSerialQueue } from '@/features/quiz/utils/createSerialQueue';
import { createId } from '@/utils/createId';
import { toIsoNow } from '@/utils/dates';

const enqueueReviewWrite = createSerialQueue();

async function getReviewDatabase(): Promise<AppDatabase> {
  return getDatabase();
}

function buildCardsFromPlan(
  plan: ReviewSessionPlanItem[],
  attemptedVocabularyIds: ReadonlySet<string>,
  vocabularyById: Map<string, ReviewCard['vocabulary']>,
): ReviewCard[] {
  const cards: ReviewCard[] = [];

  for (const item of plan) {
    if (attemptedVocabularyIds.has(item.vocabularyId)) {
      continue;
    }

    const vocabulary = vocabularyById.get(item.vocabularyId);
    if (!vocabulary) {
      continue;
    }

    cards.push({
      vocabularyId: item.vocabularyId,
      reviewDirection: item.reviewDirection,
      vocabulary,
    });
  }

  return cards;
}

async function loadActiveSession(
  db: AppDatabase,
  session: ReviewSession,
): Promise<ActiveReviewSession | null> {
  const attempts = await findAttemptsForSession(db, session.id);
  const attemptedIds = new Set(attempts.map((attempt) => attempt.vocabularyId));

  const remainingPlan = session.plan.filter((item) => !attemptedIds.has(item.vocabularyId));
  if (remainingPlan.length === 0) {
    if (!session.completedAt) {
      await markReviewSessionCompleted(db, session.id, toIsoNow());
    }
    return null;
  }

  const vocabulary = await findVocabularyByIds(remainingPlan.map((item) => item.vocabularyId));
  const vocabularyById = new Map(vocabulary.map((entry) => [entry.id, entry]));

  const cards = buildCardsFromPlan(session.plan, attemptedIds, vocabularyById);
  if (cards.length === 0) {
    if (!session.completedAt) {
      await markReviewSessionCompleted(db, session.id, toIsoNow());
    }
    return null;
  }

  return {
    session,
    cards,
    completedCount: attemptedIds.size,
  };
}

export async function getReviewHomeState(): Promise<ReviewHomeState> {
  const db = await getReviewDatabase();
  const [totalVocabulary, quizEligibleCount, incompleteSession] = await Promise.all([
    countVocabulary(),
    countQuizEligibleVocabulary(db),
    findIncompleteReviewSession(db),
  ]);

  const activeSession = incompleteSession
    ? await loadActiveSession(db, incompleteSession)
    : null;

  return {
    totalVocabulary,
    quizEligibleCount,
    activeSession,
  };
}

export async function startDailyReview(cardCount: number): Promise<ActiveReviewSession> {
  return enqueueReviewWrite(async () => {
    const db = await getReviewDatabase();
    const totalVocabulary = await countVocabulary();

    if (totalVocabulary === 0) {
      throw new ReviewError('Add vocabulary before starting a review.', 'no-vocabulary');
    }

    const incomplete = await findIncompleteReviewSession(db);
    if (incomplete) {
      const resumed = await loadActiveSession(db, incomplete);
      if (resumed) {
        return resumed;
      }
    }

    const candidates = await findReviewSelectionCandidates(db);
    const selectedIds = selectReviewVocabulary(candidates, cardCount);

    if (selectedIds.length === 0) {
      throw new ReviewError('Add vocabulary before starting a review.', 'no-vocabulary');
    }

    const directions = assignReviewDirections(selectedIds.length);
    const plan: ReviewSessionPlanItem[] = selectedIds.map((vocabularyId, index) => ({
      vocabularyId,
      reviewDirection: directions[index],
    }));

    const session: ReviewSession = {
      id: createId(),
      startedAt: toIsoNow(),
      completedAt: null,
      plan,
    };

    await insertReviewSession(db, session);

    const vocabulary = await findVocabularyByIds(selectedIds);
    const vocabularyById = new Map(vocabulary.map((entry) => [entry.id, entry]));
    const cards = buildCardsFromPlan(plan, new Set(), vocabularyById);

    if (cards.length === 0) {
      throw new ReviewError('Could not load vocabulary for this review.', 'write-failed');
    }

    return {
      session,
      cards,
      completedCount: 0,
    };
  });
}

export type ReviewResponseSubmission = {
  sessionId: string;
  vocabularyId: string;
  result: 'known' | 'unknown';
};

export type ReviewResponseOutcome = {
  sessionCompleted: boolean;
  remainingCount: number;
};

export async function submitReviewResponse(
  submission: ReviewResponseSubmission,
): Promise<ReviewResponseOutcome> {
  return enqueueReviewWrite(async () => {
    const parsed = reviewAttemptSubmissionSchema.safeParse(submission);
    if (!parsed.success) {
      throw new ReviewError(parsed.error.issues[0]?.message ?? 'Invalid review response.', 'invalid-submission');
    }

    const db = await getReviewDatabase();
    const session = await findReviewSessionById(db, parsed.data.sessionId);

    if (!session || session.completedAt) {
      throw new ReviewError('This review session is no longer available.', 'session-not-found');
    }

    const planItem = session.plan.find((item) => item.vocabularyId === parsed.data.vocabularyId);
    if (!planItem) {
      throw new ReviewError('This card is not part of the current review.', 'card-not-found');
    }

    const existingAttempts = await findAttemptsForSession(db, session.id);
    if (existingAttempts.some((attempt) => attempt.vocabularyId === parsed.data.vocabularyId)) {
      throw new ReviewError('You already answered this card.', 'already-answered');
    }

    const reviewedAt = toIsoNow();
    const { inserted } = await insertReviewAttempt(db, {
      id: createId(),
      sessionId: session.id,
      vocabularyId: parsed.data.vocabularyId,
      result: parsed.data.result,
      reviewDirection: planItem.reviewDirection,
      reviewedAt,
    });

    if (!inserted) {
      throw new ReviewError('Could not save your answer. Please try again.', 'write-failed');
    }

    const attemptedCount = existingAttempts.length + 1;
    const sessionCompleted = attemptedCount >= session.plan.length;

    if (sessionCompleted) {
      await markReviewSessionCompleted(db, session.id, reviewedAt);
    }

    return {
      sessionCompleted,
      remainingCount: Math.max(session.plan.length - attemptedCount, 0),
    };
  });
}

export async function getActiveReviewSession(sessionId: string): Promise<ActiveReviewSession | null> {
  const db = await getReviewDatabase();
  const session = await findReviewSessionById(db, sessionId);

  if (!session || session.completedAt) {
    return null;
  }

  return loadActiveSession(db, session);
}
