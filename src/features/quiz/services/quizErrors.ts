export type QuizErrorCode =
  | 'not-enough-vocabulary'
  | 'invalid-question-count'
  | 'attempt-not-found'
  | 'question-not-found'
  | 'invalid-option';

export class QuizError extends Error {
  readonly code: QuizErrorCode;

  constructor(message: string, code: QuizErrorCode, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = 'QuizError';
    this.code = code;
  }
}

export function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
