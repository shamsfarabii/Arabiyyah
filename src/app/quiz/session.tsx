import { Redirect, useLocalSearchParams } from 'expo-router';

import { QuizSessionScreen } from '@/features/quiz/screens/QuizSessionScreen';

export default function QuizSessionRoute() {
  const { questionCount } = useLocalSearchParams<{ questionCount?: string }>();
  const parsedCount = Number(questionCount);

  if (!Number.isInteger(parsedCount) || parsedCount <= 0) {
    return <Redirect href="/quiz" />;
  }

  return <QuizSessionScreen questionCount={parsedCount} />;
}
