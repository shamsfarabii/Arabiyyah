import type { AppDatabase } from '@/db/types';
import {
  findQuizAttempt,
  findQuizQuestionAt,
  incrementAttemptTotals,
  markQuizQuestionAnswered,
  recordVocabularyAttempt,
} from '@/features/quiz/repositories/quizRepository';
import {
  quizAnswerSubmissionSchema,
  type QuizAnswerSubmission,
} from '@/features/quiz/schemas/quizSchema';
import { QuizError } from '@/features/quiz/services/quizErrors';
import type {
  QuizAnswerOutcome,
  QuizQuestionRecord,
} from '@/features/quiz/types/quiz.types';
import { toIsoNow } from '@/utils/dates';

function toOutcome(question: QuizQuestionRecord): QuizAnswerOutcome {
  return {
    position: question.position,
    selectedOptionId: question.selectedOptionId,
    selectedAnswer: question.selectedAnswer,
    correctAnswer: question.correctAnswer,
    wasCorrect: question.wasCorrect === true,
    timedOut: question.timedOut === true,
    answeredAt: question.answeredAt ?? toIsoNow(),
  };
}

/**
 * Records one answer for one user.
 *
 * The caller only states which option was picked (`null` means the timer ran
 * out). Correctness is decided against the stored question, and every counter
 * is incremented by this layer — no count ever travels in from outside.
 *
 * Idempotency has two layers: an already-answered question returns its stored
 * outcome untouched, and the write itself only applies while the question is
 * still unanswered. A double tap, a retry after a failure, or a late timer
 * callback therefore cannot count a question twice.
 */
export async function recordQuizAnswer(
  db: AppDatabase,
  userId: string,
  submission: QuizAnswerSubmission,
): Promise<QuizAnswerOutcome> {
  const input = quizAnswerSubmissionSchema.parse(submission);

  const attempt = await findQuizAttempt(db, input.quizAttemptId, userId);
  if (!attempt) {
    throw new QuizError('This quiz is no longer available.', 'attempt-not-found');
  }

  if (input.position >= attempt.totalQuestions) {
    throw new QuizError('That question is not part of this quiz.', 'question-not-found');
  }

  const question = await findQuizQuestionAt(db, attempt.id, input.position);
  if (!question) {
    throw new QuizError('That question is not part of this quiz.', 'question-not-found');
  }

  if (question.answeredAt !== null) {
    return toOutcome(question);
  }

  const selectedOption =
    input.selectedOptionId === null
      ? null
      : (question.options.find((option) => option.id === input.selectedOptionId) ?? null);

  if (input.selectedOptionId !== null && selectedOption === null) {
    throw new QuizError('That answer was not offered for this question.', 'invalid-option');
  }

  const timedOut = selectedOption === null;
  const wasCorrect = selectedOption !== null && selectedOption.id === question.correctOptionId;
  const answeredAt = toIsoNow();

  await db.withTransactionAsync(async () => {
    const applied = await markQuizQuestionAnswered(db, {
      questionId: question.id,
      selectedOptionId: selectedOption?.id ?? null,
      selectedAnswer: selectedOption?.label ?? null,
      wasCorrect,
      timedOut,
      answeredAt,
    });

    if (!applied) {
      return;
    }

    await incrementAttemptTotals(db, attempt.id, wasCorrect);

    // A word deleted mid-quiz keeps its question playable through the stored
    // snapshot, but there is no row left to attribute statistics to.
    if (question.vocabularyId !== null) {
      await recordVocabularyAttempt(db, {
        userId,
        vocabularyId: question.vocabularyId,
        wasCorrect,
        answeredAt,
      });
    }
  });

  // Read back so the caller always sees what was persisted.
  const stored = await findQuizQuestionAt(db, attempt.id, input.position);
  if (stored) {
    return toOutcome(stored);
  }

  return {
    position: input.position,
    selectedOptionId: selectedOption?.id ?? null,
    selectedAnswer: selectedOption?.label ?? null,
    correctAnswer: question.correctAnswer,
    wasCorrect,
    timedOut,
    answeredAt,
  };
}
