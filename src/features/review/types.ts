import type { Vocabulary } from '@/features/vocabulary/types';

export type ReviewState = {
  vocabularyId: string;
  reviewLevel: number;
  correctCount: number;
  incorrectCount: number;
  nextReviewAt: string;
};

export type ReviewCard = {
  vocabulary: Vocabulary;
  review: ReviewState;
};
