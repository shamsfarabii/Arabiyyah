import {
  countVocabulary,
  deleteVocabulary as deleteVocabularyRow,
  findRecentVocabulary,
  findVocabularyById,
  insertVocabulary,
  searchVocabulary,
  updateVocabulary,
} from '@/features/vocabulary/repositories/vocabularyRepository';
import {
  vocabularySchema,
  type VocabularyFormValues,
  type VocabularyValidatedInput,
} from '@/features/vocabulary/schemas/vocabularySchema';
import type { HomeSummary, Vocabulary } from '@/features/vocabulary/types';
import {
  countDueReviews,
  insertInitialReviewState,
} from '@/features/review/repositories/reviewRepository';
import { createId } from '@/utils/createId';
import { toIsoNow } from '@/utils/dates';

function parseVocabularyInput(values: VocabularyFormValues): VocabularyValidatedInput {
  const parsed = vocabularySchema.safeParse(values);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue?.message ?? 'Invalid vocabulary input');
  }
  return parsed.data;
}

export async function getHomeSummary(): Promise<HomeSummary> {
  const nowIso = toIsoNow();
  const [totalWords, dueReviewCount, recentlyAdded] = await Promise.all([
    countVocabulary(),
    countDueReviews(nowIso),
    findRecentVocabulary(3),
  ]);

  return {
    totalWords,
    dueReviewCount,
    recentlyAdded,
  };
}

export async function listVocabulary(searchQuery: string): Promise<Vocabulary[]> {
  return searchVocabulary(searchQuery);
}

export async function getVocabulary(id: string): Promise<Vocabulary | null> {
  return findVocabularyById(id);
}

export async function createVocabulary(values: VocabularyFormValues): Promise<Vocabulary> {
  const input = parseVocabularyInput(values);
  const id = createId();
  const nowIso = toIsoNow();

  const vocabulary = await insertVocabulary(
    id,
    input,
    { createdAt: nowIso, updatedAt: nowIso },
  );

  await insertInitialReviewState(id, nowIso);
  return vocabulary;
}

export async function saveVocabulary(
  id: string,
  values: VocabularyFormValues,
): Promise<Vocabulary> {
  const input = parseVocabularyInput(values);
  const updatedAt = toIsoNow();
  return updateVocabulary(id, input, updatedAt);
}

export async function removeVocabulary(id: string): Promise<void> {
  await deleteVocabularyRow(id);
}
