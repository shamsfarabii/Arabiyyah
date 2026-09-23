import {
  countVocabulary,
  deleteAllVocabulary as deleteAllVocabularyRows,
  deleteVocabulary as deleteVocabularyRow,
  deleteVocabularyByIds as deleteVocabularyRowsByIds,
  findRecentVocabulary,
  findVocabularyById,
  insertVocabulary,
  searchVocabulary,
  updateVocabulary,
} from '@/features/vocabulary/repositories/vocabularyRepository';
import type { VocabularyValidatedInput } from '@/features/vocabulary/schemas/vocabularySchema';
import type { HomeSummary, Vocabulary, VocabularyInput } from '@/features/vocabulary/types';
import { getPracticeSummary } from '@/features/quiz/services/quizService';
import { insertInitialReviewState } from '@/features/review/repositories/reviewRepository';
import { getReviewHomeState } from '@/features/review/services/reviewService';
import { createId } from '@/utils/createId';
import { toIsoNow } from '@/utils/dates';

function toVocabularyInput(values: VocabularyValidatedInput): VocabularyInput {
  return {
    arabicWord: values.arabicWord,
    meaning: values.meaning,
    examples: values.examples,
    description: values.description,
    imageUri: values.imageUri,
  };
}

export async function getHomeSummary(): Promise<HomeSummary> {
  const [totalWords, practice, recentlyAdded, reviewState] = await Promise.all([
    countVocabulary(),
    getPracticeSummary(),
    findRecentVocabulary(3),
    getReviewHomeState(),
  ]);

  const activeSession = reviewState.activeSession;

  return {
    totalWords,
    recentlyAdded,
    practice,
    review: {
      canStart: reviewState.totalVocabulary > 0,
      quizEligibleCount: reviewState.quizEligibleCount,
      activeProgress: activeSession
        ? {
            sessionId: activeSession.session.id,
            completedCount: activeSession.completedCount,
            totalCount: activeSession.session.plan.length,
          }
        : null,
    },
  };
}

export async function listVocabulary(searchQuery: string): Promise<Vocabulary[]> {
  return searchVocabulary(searchQuery);
}

export async function getVocabulary(id: string): Promise<Vocabulary | null> {
  return findVocabularyById(id);
}

export async function createVocabulary(values: VocabularyValidatedInput): Promise<Vocabulary> {
  const input = toVocabularyInput(values);
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
  values: VocabularyValidatedInput,
): Promise<Vocabulary> {
  const input = toVocabularyInput(values);
  const updatedAt = toIsoNow();
  return updateVocabulary(id, input, updatedAt);
}

export async function removeVocabulary(id: string): Promise<void> {
  await deleteVocabularyRow(id);
}

export async function removeVocabularies(ids: string[]): Promise<number> {
  return deleteVocabularyRowsByIds(ids);
}

export async function removeAllVocabulary(): Promise<number> {
  return deleteAllVocabularyRows();
}
