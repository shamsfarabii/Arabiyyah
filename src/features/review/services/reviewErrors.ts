export type ReviewErrorCode =
  | 'session-not-found'
  | 'card-not-found'
  | 'already-answered'
  | 'invalid-submission'
  | 'no-vocabulary'
  | 'write-failed';

export class ReviewError extends Error {
  readonly code: ReviewErrorCode;

  constructor(message: string, code: ReviewErrorCode) {
    super(message);
    this.name = 'ReviewError';
    this.code = code;
  }
}

export function toReviewErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ReviewError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}
