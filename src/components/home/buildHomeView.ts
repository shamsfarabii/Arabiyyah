import type { HomeSummary, Vocabulary } from '@/features/vocabulary/types';

import { RECENTLY_ADDED_LIMIT } from '@/components/home/homeLayout';

const LOADING_VALUE = '—';
const LOADING_DESCRIPTION = 'Loading your progress…';

export type HomeStat = {
  label: string;
  value: string;
};

export type HomeReviewCard = {
  description: string;
  buttonLabel: string;
  isDisabled: boolean;
  progressPercent: number | null;
  sessionId: string | null;
};

export type HomeView = {
  totalWordsText: string;
  collectedLabel: string;
  vocabularyAccessibilityLabel: string;
  stats: HomeStat[];
  review: HomeReviewCard;
  quizDescription: string;
  recentItems: Vocabulary[];
};

export function buildHomeView(summary: HomeSummary, isLoading: boolean): HomeView {
  const reviewProgress = summary.review.activeProgress;
  const reviewPercent =
    reviewProgress && reviewProgress.totalCount > 0
      ? Math.min(
          100,
          Math.round((reviewProgress.completedCount / reviewProgress.totalCount) * 100),
        )
      : 0;

  const reviewDescription = reviewProgress
    ? `${reviewProgress.completedCount} / ${reviewProgress.totalCount} reviewed`
    : summary.review.quizEligibleCount === summary.totalWords
      ? 'Review your words before quizzing'
      : `${summary.review.quizEligibleCount} of ${summary.totalWords} ready for quiz`;

  const quizDescription =
    summary.practice.accuracyPercent === null
      ? `Practice your ${summary.totalWords} ${summary.totalWords === 1 ? 'word' : 'words'}`
      : `${summary.practice.answeredCount} answered · ${summary.practice.accuracyPercent}% accuracy`;

  return {
    totalWordsText: isLoading ? LOADING_VALUE : String(summary.totalWords),
    collectedLabel: `${summary.totalWords === 1 ? 'word' : 'words'} collected`,
    vocabularyAccessibilityLabel: `Vocabulary, ${summary.totalWords} words collected`,
    stats: [
      {
        label: 'Answered',
        value: isLoading ? LOADING_VALUE : String(summary.practice.answeredCount),
      },
      {
        label: 'Accuracy',
        value:
          isLoading || summary.practice.accuracyPercent === null
            ? LOADING_VALUE
            : `${summary.practice.accuracyPercent}%`,
      },
      {
        label: 'Quiz ready',
        value: isLoading ? LOADING_VALUE : String(summary.review.quizEligibleCount),
      },
    ],
    review: {
      description: isLoading ? LOADING_DESCRIPTION : reviewDescription,
      buttonLabel: reviewProgress ? 'Continue Review' : 'Start Review',
      isDisabled: isLoading || !summary.review.canStart,
      progressPercent: reviewProgress ? reviewPercent : null,
      sessionId: reviewProgress ? reviewProgress.sessionId : null,
    },
    quizDescription: isLoading ? LOADING_DESCRIPTION : quizDescription,
    recentItems: summary.recentlyAdded.slice(0, RECENTLY_ADDED_LIMIT),
  };
}
