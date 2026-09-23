import { Redirect, useLocalSearchParams } from 'expo-router';

import { ReviewSessionScreen } from '@/features/review/screens/ReviewSessionScreen';

export default function ReviewSessionRoute() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();

  if (!sessionId?.trim()) {
    return <Redirect href="/review" />;
  }

  return <ReviewSessionScreen sessionId={sessionId} />;
}
