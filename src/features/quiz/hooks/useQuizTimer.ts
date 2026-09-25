import { useEffect, useRef, useState } from 'react';

import { createCountdown } from '@/features/quiz/utils/createCountdown';

type UseQuizTimerOptions = {
  durationSeconds: number;
  questionKey: string | null;
  isActive: boolean;
  onExpire: () => void;
};

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
