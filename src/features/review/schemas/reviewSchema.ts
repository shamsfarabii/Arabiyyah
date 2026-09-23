import { z } from 'zod';

import { DAILY_REVIEW_PRESET_COUNTS } from '@/features/review/constants';

const reviewDirectionSchema = z.enum(['arabic_to_meaning', 'meaning_to_arabic']);

const reviewResultSchema = z.enum(['known', 'unknown']);

export const reviewSessionPlanItemSchema = z.object({
  vocabularyId: z.string().min(1),
  reviewDirection: reviewDirectionSchema,
});

export const reviewSessionPlanSchema = z.array(reviewSessionPlanItemSchema).min(1);

export const reviewAttemptSubmissionSchema = z.object({
  sessionId: z.string().min(1),
  vocabularyId: z.string().min(1),
  result: reviewResultSchema,
});

export function createReviewCountSchema(availableCount: number) {
  const maxCount = Math.max(availableCount, 0);

  return z
    .number()
    .int('Enter a whole number of cards.')
    .min(1, 'Review at least one card.')
    .max(maxCount, maxCount === 0 ? 'Add vocabulary before reviewing.' : `You only have ${maxCount} words.`);
}

export function parseReviewCount(
  rawValue: string,
  availableCount: number,
): { ok: true; value: number } | { ok: false; error: string } {
  const trimmed = rawValue.trim();
  if (!trimmed.length) {
    return { ok: false, error: 'Enter how many cards to review.' };
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) {
    return { ok: false, error: 'Enter a whole number of cards.' };
  }

  const result = createReviewCountSchema(availableCount).safeParse(parsed);
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? 'Invalid card count.' };
  }

  return { ok: true, value: result.data };
}

export function isDailyReviewPresetCount(value: number): boolean {
  return (DAILY_REVIEW_PRESET_COUNTS as readonly number[]).includes(value);
}
