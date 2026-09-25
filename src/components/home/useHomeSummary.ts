import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { getHomeSummary } from '@/features/vocabulary/services/vocabularyService';
import type { HomeSummary } from '@/features/vocabulary/types';

const emptySummary: HomeSummary = {
  totalWords: 0,
  recentlyAdded: [],
  practice: { answeredCount: 0, accuracyPercent: null },
  review: {
    canStart: false,
    quizEligibleCount: 0,
    activeProgress: null,
  },
};

export function useHomeSummary(): { summary: HomeSummary; isLoading: boolean } {
  const [summary, setSummary] = useState<HomeSummary>(emptySummary);
  const [isLoading, setIsLoading] = useState(true);
  const requestId = useRef(0);

  const loadSummary = useCallback(async () => {
    const id = requestId.current + 1;
    requestId.current = id;
    setIsLoading(true);

    try {
      const nextSummary = await getHomeSummary();
      if (id !== requestId.current) return;
      setSummary(nextSummary);
    } finally {
      if (id === requestId.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSummary();
    }, [loadSummary]),
  );

  return { summary, isLoading };
}
