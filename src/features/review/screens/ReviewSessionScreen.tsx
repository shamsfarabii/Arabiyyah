import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
} from '@/constants/theme';
import type { ReviewCard } from '@/features/review/types';
import {
  getDueReviewCards,
  recordAgain,
  recordKnow,
} from '@/features/review/services/reviewService';
import { createShadow } from '@/helpers/styleHelpers';
import { commonStyles } from '@/styles/commonStyles';

export function ReviewSessionScreen() {
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadCards = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const dueCards = await getDueReviewCards();
      setCards(dueCards);
      setCurrentIndex(0);
      setIsAnswerVisible(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Could not load review cards.';
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCards();
    }, [loadCards]),
  );

  const currentCard = cards[currentIndex];

  const finishSession = () => {
    Alert.alert('Review complete', 'Nice work. Come back tomorrow for more cards.', [
      { text: 'OK', onPress: () => router.replace('/') },
    ]);
  };

  const goToNextCard = () => {
    setIsAnswerVisible(false);
    if (currentIndex + 1 >= cards.length) {
      finishSession();
      return;
    }
    setCurrentIndex((value) => value + 1);
  };

  const handleAgain = async () => {
    if (!currentCard || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await recordAgain(currentCard.vocabulary.id);
      goToNextCard();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Could not save review result.';
      Alert.alert('Review failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKnow = async () => {
    if (!currentCard || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await recordKnow(currentCard.vocabulary.id);
      goToNextCard();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Could not save review result.';
      Alert.alert('Review failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenScaffold scroll={false}>
      <ScreenHeader title="Review" onBack={() => router.back()} />

      {isLoading ? (
        <View style={[commonStyles.grow, commonStyles.centered]}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : null}

      {!isLoading && loadError ? (
        <View style={[commonStyles.grow, commonStyles.centered, styles.emptyState]}>
          <Text style={styles.emptyTitle}>Could not start review</Text>
          <Text style={styles.emptyBody}>{loadError}</Text>
          <Pressable onPress={() => void loadCards()}>
            <Text style={styles.retryLink}>Try again</Text>
          </Pressable>
        </View>
      ) : null}

      {!isLoading && !loadError && cards.length === 0 ? (
        <View style={[commonStyles.grow, commonStyles.centered, styles.emptyState]}>
          <Text style={styles.emptyTitle}>No cards due</Text>
          <Text style={styles.emptyBody}>
            Add vocabulary or come back when cards are scheduled.
          </Text>
          <PrimaryButton
            label="Back to Home"
            onPress={() => router.replace('/')}
            variant="secondary"
            style={styles.backHomeButton}
          />
        </View>
      ) : null}

      {!isLoading && !loadError && currentCard ? (
        <View style={commonStyles.grow}>
          <View style={[styles.card, commonStyles.centered, cardShadow]}>
            <Text style={styles.arabicWord}>{currentCard.vocabulary.arabicWord}</Text>

            {!isAnswerVisible ? (
              <>
                <Text style={styles.prompt}>What does this mean?</Text>
                <PrimaryButton
                  label="Show Answer"
                  onPress={() => setIsAnswerVisible(true)}
                  style={styles.showAnswerButton}
                />
              </>
            ) : (
              <View style={styles.answerBlock}>
                <Text style={styles.meaning}>{currentCard.vocabulary.meaning}</Text>
                {currentCard.vocabulary.examples.length > 0 ? (
                  <View style={styles.examplesBlock}>
                    {currentCard.vocabulary.examples.map((example, index) => (
                      <View
                        key={`${example.sentence}-${index}`}
                        style={styles.exampleItem}
                      >
                        <Text style={styles.example}>{example.sentence}</Text>
                        {example.meaning ? (
                          <Text style={styles.exampleMeaning}>{example.meaning}</Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : null}
                {currentCard.vocabulary.description ? (
                  <Text style={styles.description}>
                    {currentCard.vocabulary.description}
                  </Text>
                ) : null}
                {currentCard.vocabulary.imageUri ? (
                  <Image
                    source={{ uri: currentCard.vocabulary.imageUri }}
                    style={styles.image}
                    contentFit="cover"
                  />
                ) : null}
              </View>
            )}
          </View>

          {isAnswerVisible ? (
            <View style={[commonStyles.row, styles.actions]}>
              <PrimaryButton
                label="Again"
                onPress={() => void handleAgain()}
                variant="secondary"
                disabled={isSubmitting}
                style={commonStyles.grow}
              />
              <PrimaryButton
                label="Know"
                onPress={() => void handleKnow()}
                disabled={isSubmitting}
                style={commonStyles.grow}
              />
            </View>
          ) : null}

          <Text style={styles.progress}>
            {currentIndex + 1} / {cards.length}
          </Text>
        </View>
      ) : null}
    </ScreenScaffold>
  );
}

const cardShadow = createShadow(4, COLORS.accent, 0.08, 6);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: BORDER_RADIUS.card,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  arabicWord: {
    fontSize: 44,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.arabicWord,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  prompt: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textMutedSecondary,
    marginBottom: SPACING.lg,
  },
  showAnswerButton: {
    alignSelf: 'stretch',
  },
  answerBlock: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  meaning: {
    fontSize: FONT_SIZES.hero,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  example: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
    textAlign: 'center',
  },
  examplesBlock: {
    alignSelf: 'stretch',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  exampleItem: {
    gap: SPACING.xs,
  },
  exampleMeaning: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.sm,
  },
  actions: {
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  progress: {
    textAlign: 'center',
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  emptyState: {
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  retryLink: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  backHomeButton: {
    alignSelf: 'stretch',
    marginTop: SPACING.md,
  },
});
