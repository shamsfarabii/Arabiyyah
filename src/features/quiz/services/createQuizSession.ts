import type { AppDatabase } from '@/db/types';
import {
  QUESTION_COUNT_ERRORS,
  createQuestionCountSchema,
} from '@/features/quiz/schemas/quizSchema';
import {
  findQuizCandidates,
  insertQuizSession,
} from '@/features/quiz/repositories/quizRepository';
import { QuizError } from '@/features/quiz/services/quizErrors';
import type { QuizAttempt, QuizQuestion, QuizSession } from '@/features/quiz/types/quiz.types';
import {
  buildQuizQuestions,
  hasEnoughVocabularyForQuiz,
} from '@/features/quiz/utils/buildQuizQuestions';
import type { RandomGenerator } from '@/features/quiz/utils/random';
import { selectQuizVocabulary } from '@/features/quiz/utils/selectQuizVocabulary';
import { createId } from '@/utils/createId';
import { toIsoNow } from '@/utils/dates';

export async function createQuizSession(
  db: AppDatabase,
  userId: string,
  questionCount: number,
  random?: RandomGenerator,
): Promise<QuizSession> {
  const candidates = await findQuizCandidates(db, userId);

  if (!hasEnoughVocabularyForQuiz(candidates.length)) {
    throw new QuizError(QUESTION_COUNT_ERRORS.notEnoughVocabulary, 'not-enough-vocabulary');
  }

  const parsedCount = createQuestionCountSchema(candidates.length).safeParse(questionCount);
  if (!parsedCount.success) {
    throw new QuizError(parsedCount.error.issues[0].message, 'invalid-question-count');
  }

  const selected = selectQuizVocabulary(candidates, parsedCount.data, random);
  const questions: QuizQuestion[] = buildQuizQuestions(selected, candidates, random).map(
    (draft) => ({ ...draft, id: createId() }),
  );

  const attempt: QuizAttempt = {
    id: createId(),
    userId,
    startedAt: toIsoNow(),
    completedAt: null,
    totalQuestions: questions.length,
    correctAnswers: 0,
    wrongAnswers: 0,
  };

  await insertQuizSession(db, attempt, questions);

  return { attempt, questions };
}
