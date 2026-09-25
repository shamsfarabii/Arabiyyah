import type { AppDatabase } from '@/db/types';
import { quizOptionsSchema } from '@/features/quiz/schemas/quizSchema';
import type {
  PracticeSummary,
  QuizAnswerRecord,
  QuizAttempt,
  QuizQuestion,
  QuizQuestionRecord,
  QuizVocabularyCandidate,
} from '@/features/quiz/types/quiz.types';

type CandidateRow = {
  id: string;
  arabic_word: string;
  meaning: string;
  correct_count: number;
  wrong_count: number;
  total_attempts: number;
};

type AttemptRow = {
  id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
};

type QuestionRow = {
  id: string;
  position: number;
  vocabulary_id: string | null;
  correct_option_id: string;
  prompt_word: string;
  correct_answer: string;
  options_json: string;
  selected_option_id: string | null;
  selected_answer: string | null;
  was_correct: number | null;
  timed_out: number | null;
  answered_at: string | null;
};

function toBoolean(value: number | null): boolean | null {
  return value === null ? null : value !== 0;
}

function mapCandidateRow(row: CandidateRow): QuizVocabularyCandidate {
  return {
    vocabularyId: row.id,
    arabicWord: row.arabic_word,
    meaning: row.meaning,
    stats: {
      correctCount: row.correct_count,
      wrongCount: row.wrong_count,
      totalAttempts: row.total_attempts,
    },
  };
}

function mapAttemptRow(row: AttemptRow): QuizAttempt {
  return {
    id: row.id,
    userId: row.user_id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    totalQuestions: row.total_questions,
    correctAnswers: row.correct_answers,
    wrongAnswers: row.wrong_answers,
  };
}

function mapQuestionRow(row: QuestionRow): QuizQuestionRecord {
  return {
    id: row.id,
    position: row.position,
    vocabularyId: row.vocabulary_id,
    correctOptionId: row.correct_option_id,
    promptWord: row.prompt_word,
    correctAnswer: row.correct_answer,
    options: quizOptionsSchema.parse(JSON.parse(row.options_json)),
    selectedOptionId: row.selected_option_id,
    selectedAnswer: row.selected_answer,
    wasCorrect: toBoolean(row.was_correct),
    timedOut: toBoolean(row.timed_out),
    answeredAt: row.answered_at,
  };
}

export async function findQuizCandidates(
  db: AppDatabase,
  userId: string,
): Promise<QuizVocabularyCandidate[]> {
  const rows = await db.getAllAsync<CandidateRow>(
    `SELECT
       v.id,
       v.arabic_word,
       v.meaning,
       COALESCE(s.correct_count, 0) AS correct_count,
       COALESCE(s.wrong_count, 0) AS wrong_count,
       COALESCE(s.total_attempts, 0) AS total_attempts
     FROM vocabulary v
     INNER JOIN (
       SELECT DISTINCT vocabulary_id
       FROM review_attempt
     ) reviewed
       ON reviewed.vocabulary_id = v.id
     LEFT JOIN vocabulary_stats s
       ON s.vocabulary_id = v.id
      AND s.user_id = ?
     ORDER BY datetime(v.created_at) ASC;`,
    userId,
  );

  return rows.map(mapCandidateRow);
}

export async function insertQuizSession(
  db: AppDatabase,
  attempt: QuizAttempt,
  questions: QuizQuestion[],
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO quiz_attempt (
        id,
        user_id,
        started_at,
        completed_at,
        total_questions,
        correct_answers,
        wrong_answers
      ) VALUES (?, ?, ?, NULL, ?, 0, 0);`,
      attempt.id,
      attempt.userId,
      attempt.startedAt,
      attempt.totalQuestions,
    );

    for (const question of questions) {
      await db.runAsync(
        `INSERT INTO quiz_question (
          id,
          quiz_attempt_id,
          position,
          vocabulary_id,
          correct_option_id,
          prompt_word,
          correct_answer,
          options_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        question.id,
        attempt.id,
        question.position,
        question.vocabularyId,
        question.vocabularyId,
        question.promptWord,
        question.correctAnswer,
        JSON.stringify(question.options),
      );
    }
  });
}

export async function findQuizAttempt(
  db: AppDatabase,
  attemptId: string,
  userId: string,
): Promise<QuizAttempt | null> {
  const row = await db.getFirstAsync<AttemptRow>(
    'SELECT * FROM quiz_attempt WHERE id = ? AND user_id = ? LIMIT 1;',
    attemptId,
    userId,
  );

  return row ? mapAttemptRow(row) : null;
}

export async function findQuizQuestionAt(
  db: AppDatabase,
  attemptId: string,
  position: number,
): Promise<QuizQuestionRecord | null> {
  const row = await db.getFirstAsync<QuestionRow>(
    `SELECT * FROM quiz_question
     WHERE quiz_attempt_id = ? AND position = ?
     LIMIT 1;`,
    attemptId,
    position,
  );

  return row ? mapQuestionRow(row) : null;
}

export async function findQuizQuestions(
  db: AppDatabase,
  attemptId: string,
): Promise<QuizQuestionRecord[]> {
  const rows = await db.getAllAsync<QuestionRow>(
    `SELECT * FROM quiz_question
     WHERE quiz_attempt_id = ?
     ORDER BY position ASC;`,
    attemptId,
  );

  return rows.map(mapQuestionRow);
}

export async function markQuizQuestionAnswered(
  db: AppDatabase,
  input: {
    questionId: string;
    selectedOptionId: string | null;
    selectedAnswer: string | null;
    wasCorrect: boolean;
    timedOut: boolean;
    answeredAt: string;
  },
): Promise<boolean> {
  const result = await db.runAsync(
    `UPDATE quiz_question
     SET selected_option_id = ?,
         selected_answer = ?,
         was_correct = ?,
         timed_out = ?,
         answered_at = ?
     WHERE id = ?
       AND answered_at IS NULL;`,
    input.selectedOptionId,
    input.selectedAnswer,
    input.wasCorrect ? 1 : 0,
    input.timedOut ? 1 : 0,
    input.answeredAt,
    input.questionId,
  );

  return result.changes > 0;
}

export async function incrementAttemptTotals(
  db: AppDatabase,
  attemptId: string,
  wasCorrect: boolean,
): Promise<void> {
  await db.runAsync(
    `UPDATE quiz_attempt
     SET correct_answers = correct_answers + ?,
         wrong_answers = wrong_answers + ?
     WHERE id = ?;`,
    wasCorrect ? 1 : 0,
    wasCorrect ? 0 : 1,
    attemptId,
  );
}

export async function recordVocabularyAttempt(
  db: AppDatabase,
  input: {
    userId: string;
    vocabularyId: string;
    wasCorrect: boolean;
    answeredAt: string;
  },
): Promise<void> {
  await db.runAsync(
    `INSERT INTO vocabulary_stats (
      user_id,
      vocabulary_id,
      correct_count,
      wrong_count,
      total_attempts,
      last_attempted_at
    ) VALUES (?, ?, ?, ?, 1, ?)
    ON CONFLICT(user_id, vocabulary_id) DO UPDATE SET
      correct_count = correct_count + excluded.correct_count,
      wrong_count = wrong_count + excluded.wrong_count,
      total_attempts = total_attempts + 1,
      last_attempted_at = excluded.last_attempted_at;`,
    input.userId,
    input.vocabularyId,
    input.wasCorrect ? 1 : 0,
    input.wasCorrect ? 0 : 1,
    input.answeredAt,
  );
}

export async function markAttemptCompleted(
  db: AppDatabase,
  attemptId: string,
  userId: string,
  completedAt: string,
): Promise<void> {
  await db.runAsync(
    `UPDATE quiz_attempt
     SET completed_at = ?
     WHERE id = ?
       AND user_id = ?
       AND completed_at IS NULL;`,
    completedAt,
    attemptId,
    userId,
  );
}

export async function findAnsweredQuestions(
  db: AppDatabase,
  attemptId: string,
): Promise<QuizAnswerRecord[]> {
  const rows = await db.getAllAsync<QuestionRow>(
    `SELECT * FROM quiz_question
     WHERE quiz_attempt_id = ?
       AND answered_at IS NOT NULL
     ORDER BY position ASC;`,
    attemptId,
  );

  return rows.map((row) => ({
    position: row.position,
    vocabularyId: row.vocabulary_id,
    promptWord: row.prompt_word,
    correctAnswer: row.correct_answer,
    selectedOptionId: row.selected_option_id,
    selectedAnswer: row.selected_answer,
    wasCorrect: row.was_correct !== 0 && row.was_correct !== null,
    timedOut: row.timed_out === 1,
    answeredAt: row.answered_at ?? '',
  }));
}

export async function findPracticeSummary(
  db: AppDatabase,
  userId: string,
): Promise<PracticeSummary> {
  const row = await db.getFirstAsync<{ correct: number; total: number }>(
    `SELECT
       COALESCE(SUM(correct_count), 0) AS correct,
       COALESCE(SUM(total_attempts), 0) AS total
     FROM vocabulary_stats
     WHERE user_id = ?;`,
    userId,
  );

  const total = row?.total ?? 0;
  const correct = row?.correct ?? 0;

  return {
    answeredCount: total,
    accuracyPercent: total === 0 ? null : Math.round((correct / total) * 100),
  };
}
