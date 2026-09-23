import { Redirect, useLocalSearchParams } from 'expo-router';

import { QuizSessionScreen } from '@/features/quiz/screens/QuizSessionScreen';

export default function QuizSessionRoute() {
  const { questionCount } = useLocalSearchParams<{ questionCount?: string }>();
  const parsedCount = Number(questionCount);

  // The count is re-validated by the quiz service; this only guards against
  // landing here with no usable parameter at all (deep link, reload).
  if (!Number.isInteger(parsedCount) || parsedCount <= 0) {
    return <Redirect href="/quiz" />;
  }

  return <QuizSessionScreen questionCount={parsedCount} />;
}
