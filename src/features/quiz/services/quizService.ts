import { getDatabase } from '@/db/database';
import type { AppDatabase } from '@/db/types';
import { getCurrentUserId } from '@/features/auth/services/currentUserService';
import {
  findAnsweredQuestions,
  findPracticeSummary,
  findQuizAttempt,
  markAttemptCompleted,
} from '@/features/quiz/repositories/quizRepository';
import type { QuizAnswerSubmission } from '@/features/quiz/schemas/quizSchema';
import { createQuizSession } from '@/features/quiz/services/createQuizSession';
import { QuizError } from '@/features/quiz/services/quizErrors';
import { recordQuizAnswer } from '@/features/quiz/services/recordQuizAnswer';
import type {
  PracticeSummary,
  QuizAnswerOutcome,
  QuizResult,
  QuizSession,
} from '@/features/quiz/types/quiz.types';
import { hasEnoughVocabularyForQuiz } from '@/features/quiz/utils/buildQuizQuestions';
import { createSerialQueue } from '@/features/quiz/utils/createSerialQueue';
import { countQuizEligibleVocabulary } from '@/features/review/repositories/reviewRepository';
import { countVocabulary } from '@/features/vocabulary/repositories/vocabularyRepository';
import { toIsoNow } from '@/utils/dates';

/** Every quiz write runs in this single lane; see `createSerialQueue`. */
const enqueueQuizWrite = createSerialQueue();

async function getQuizDatabase(): Promise<AppDatabase> {
  return getDatabase();
}

export type QuizSetupInfo = {
  /** Vocabulary with at least one completed review attempt. */
  availableCount: number;
  canStart: boolean;
  /** All saved vocabulary, including words not yet reviewed. */
  totalVocabulary: number;
};

export async function getQuizSetupInfo(): Promise<QuizSetupInfo> {
  const db = await getQuizDatabase();
  const [totalVocabulary, eligibleCount] = await Promise.all([
    countVocabulary(),
    countQuizEligibleVocabulary(db),
  ]);

  return {
    availableCount: eligibleCount,
    canStart: hasEnoughVocabularyForQuiz(eligibleCount),
    totalVocabulary,
  };
}

export async function getPracticeSummary(): Promise<PracticeSummary> {
  const db = await getQuizDatabase();
  const userId = await getCurrentUserId();
  return findPracticeSummary(db, userId);
}

export async function startQuiz(questionCount: number): Promise<QuizSession> {
  return enqueueQuizWrite(async () => {
    const db = await getQuizDatabase();
    const userId = await getCurrentUserId();
    return createQuizSession(db, userId, questionCount);
  });
}

export async function submitQuizAnswer(
  submission: QuizAnswerSubmission,
): Promise<QuizAnswerOutcome> {
  return enqueueQuizWrite(async () => {
    const db = await getQuizDatabase();
    const userId = await getCurrentUserId();
    return recordQuizAnswer(db, userId, submission);
  });
}

export async function completeQuiz(attemptId: string): Promise<QuizResult> {
  await enqueueQuizWrite(async () => {
    const db = await getQuizDatabase();
    const userId = await getCurrentUserId();
    await markAttemptCompleted(db, attemptId, userId, toIsoNow());
  });

  return getQuizResult(attemptId);
}

/** The score shown to the user is read back from the database, not tallied in the UI. */
export async function getQuizResult(attemptId: string): Promise<QuizResult> {
  const db = await getQuizDatabase();
  const userId = await getCurrentUserId();

  const attempt = await findQuizAttempt(db, attemptId, userId);
  if (!attempt) {
    throw new QuizError('This quiz is no longer available.', 'attempt-not-found');
  }

  const answers = await findAnsweredQuestions(db, attempt.id);
  const accuracyPercent =
    attempt.totalQuestions === 0
      ? 0
      : Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100);

  return { attempt, answers, accuracyPercent };
}
