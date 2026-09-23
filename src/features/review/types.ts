import type { Vocabulary } from '@/features/vocabulary/types';

export type ReviewResult = 'known' | 'unknown';

export type ReviewDirection = 'arabic_to_meaning' | 'meaning_to_arabic';

export type ReviewSessionPlanItem = {
  vocabularyId: string;
  reviewDirection: ReviewDirection;
};

export type ReviewSession = {
  id: string;
  startedAt: string;
  completedAt: string | null;
  plan: ReviewSessionPlanItem[];
};

export type ReviewAttempt = {
  id: string;
  sessionId: string;
  vocabularyId: string;
  result: ReviewResult;
  reviewDirection: ReviewDirection;
  reviewedAt: string;
};

export type ReviewSelectionCandidate = {
  vocabularyId: string;
  lastReviewedAt: string | null;
  lastResult: ReviewResult | null;
  everReviewed: boolean;
};

export type ReviewCard = {
  vocabularyId: string;
  reviewDirection: ReviewDirection;
  vocabulary: Vocabulary;
};

export type ActiveReviewSession = {
  session: ReviewSession;
  cards: ReviewCard[];
  completedCount: number;
};

export type ReviewHomeState = {
  totalVocabulary: number;
  quizEligibleCount: number;
  activeSession: ActiveReviewSession | null;
};
