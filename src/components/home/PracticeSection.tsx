import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ActionCard } from '@/components/home/ActionCard';
import type { HomeReviewCard } from '@/components/home/buildHomeView';
import { HOME_MAX_FONT_SCALE } from '@/components/home/homeLayout';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING } from '@/constants/theme';

type PracticeSectionProps = {
  isWide: boolean;
  review: HomeReviewCard;
  quizDescription: string;
};

export function PracticeSection({ isWide, review, quizDescription }: PracticeSectionProps) {
  const handleDailyReview = () => {
    if (review.sessionId) {
      router.push({
        pathname: '/review/session',
        params: { sessionId: review.sessionId },
      });
      return;
    }

    router.push('/review');
  };

  return (
    <View>
      <Text style={styles.sectionTitle} maxFontSizeMultiplier={HOME_MAX_FONT_SCALE}>
        Practice
      </Text>

      <View style={[styles.actions, isWide && styles.actionsWide]}>
        <ActionCard
          icon="refresh"
          title="Daily Review"
          description={review.description}
          buttonLabel={review.buttonLabel}
          variant="secondary"
          disabled={review.isDisabled}
          onPress={handleDailyReview}
          isWide={isWide}
          progressPercent={review.progressPercent}
        />

        <ActionCard
          icon="quiz"
          title="Quiz"
          description={quizDescription}
          buttonLabel="Attempt Quiz"
          variant="primary"
          onPress={() => router.push('/quiz')}
          isWide={isWide}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm + SPACING.xs,
  },
  actions: {
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  actionsWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
});
