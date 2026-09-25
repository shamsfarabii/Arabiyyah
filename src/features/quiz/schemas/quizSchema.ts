import { z } from 'zod';

import { MIN_QUIZ_VOCABULARY_COUNT } from '@/features/quiz/constants';

export const QUESTION_COUNT_ERRORS = {
  required: 'Enter how many questions you want to attempt.',
  wholeNumber: 'Enter a whole number.',
  min: 'Attempt at least 1 question.',
  notEnoughVocabulary: `Add at least ${MIN_QUIZ_VOCABULARY_COUNT} vocabulary words to start a quiz.`,
} as const;

export function maximumQuestionsMessage(availableCount: number): string {
  return availableCount === 1
    ? 'You only have 1 vocabulary word available.'
    : `You only have ${availableCount} vocabulary words available.`;
}

export function createQuestionCountSchema(availableCount: number) {
  return z
    .number(QUESTION_COUNT_ERRORS.wholeNumber)
    .int(QUESTION_COUNT_ERRORS.wholeNumber)
    .min(1, QUESTION_COUNT_ERRORS.min)
    .max(availableCount, maximumQuestionsMessage(availableCount));
}

export type QuestionCountParseResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

const digitsOnlySchema = z
  .string(QUESTION_COUNT_ERRORS.required)
  .trim()
  .min(1, QUESTION_COUNT_ERRORS.required)
  .regex(/^\d+$/, QUESTION_COUNT_ERRORS.wholeNumber);

export function parseQuestionCount(
  rawValue: string,
  availableCount: number,
): QuestionCountParseResult {
  if (availableCount < MIN_QUIZ_VOCABULARY_COUNT) {
    return { ok: false, error: QUESTION_COUNT_ERRORS.notEnoughVocabulary };
  }

  const text = digitsOnlySchema.safeParse(rawValue);
  if (!text.success) {
    return { ok: false, error: text.error.issues[0].message };
  }

  const parsed = createQuestionCountSchema(availableCount).safeParse(Number(text.data));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  return { ok: true, value: parsed.data };
}

export const quizAnswerSubmissionSchema = z.object({
  quizAttemptId: z.string().min(1),
  position: z.number().int().min(0),
  selectedOptionId: z.string().min(1).nullable(),
});

export type QuizAnswerSubmission = z.infer<typeof quizAnswerSubmissionSchema>;

export const quizOptionsSchema = z.array(
  z.object({
    id: z.string().min(1),
    label: z.string(),
  }),
);
