import { useEffect, useRef, useState } from 'react';

import { createCountdown } from '@/features/quiz/utils/createCountdown';

type UseQuizTimerOptions = {
  durationSeconds: number;
  /** Identifies the question being timed; a change restarts the countdown. */
  questionKey: string | null;
  isActive: boolean;
  onExpire: () => void;
};

/**
 * Runs exactly one countdown at a time.
 *
 * The effect is keyed by the question, so moving on always tears the previous
 * countdown down before the next one starts, and unmounting (including
 * navigating away mid-quiz) stops it. `onExpire` is read through a ref so a
 * re-render cannot leave the timer holding a stale callback.
 */
export function useQuizTimer({
  durationSeconds,
  questionKey,
  isActive,
  onExpire,
}: UseQuizTimerOptions): number {
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const [timedQuestionKey, setTimedQuestionKey] = useState(questionKey);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Reset while rendering the new question so the previous question's final
  // value is never shown, not even for a frame.
  if (questionKey !== timedQuestionKey) {
    setTimedQuestionKey(questionKey);
    setRemainingSeconds(durationSeconds);
  }

  useEffect(() => {
    if (!isActive || questionKey === null) {
      return;
    }

    const countdown = createCountdown({
      durationSeconds,
      onTick: setRemainingSeconds,
      onExpire: () => onExpireRef.current(),
    });

    return () => countdown.stop();
  }, [durationSeconds, isActive, questionKey]);

  return remainingSeconds;
}
