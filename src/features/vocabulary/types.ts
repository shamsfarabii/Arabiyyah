import type { PracticeSummary } from '@/features/quiz/types/quiz.types';

export type VocabularyExample = {
  sentence: string;
  meaning?: string;
};

export type Vocabulary = {
  id: string;
  arabicWord: string;
  meaning: string;
  examples: VocabularyExample[];
  description?: string;
  imageUri?: string;
  createdAt: string;
  updatedAt: string;
};

export type VocabularyInput = {
  arabicWord: string;
  meaning: string;
  examples: VocabularyExample[];
  description?: string;
  imageUri?: string;
};

export type ReviewProgressSummary = {
  sessionId: string;
  completedCount: number;
  totalCount: number;
};

export type HomeSummary = {
  totalWords: number;
  recentlyAdded: Vocabulary[];
  practice: PracticeSummary;
  review: {
    canStart: boolean;
    quizEligibleCount: number;
    activeProgress: ReviewProgressSummary | null;
  };
};
