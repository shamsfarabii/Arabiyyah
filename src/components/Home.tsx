import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  ICON_SIZES,
  SIZES,
  SPACING,
} from '@/constants/theme';
import { createShadow } from '@/helpers/styleHelpers';
import { commonStyles } from '@/styles/commonStyles';

import {
  BodyText,
  Heading,
  styledTextSpacing,
  Subheading,
} from '@/components/StyledText';
import { AppIcon } from '@/components/ui/AppIcon';
import type { HomeSummary } from '@/features/vocabulary/types';
import { getHomeSummary } from '@/features/vocabulary/services/vocabularyService';

const emptySummary: HomeSummary = {
  totalWords: 0,
  dueReviewCount: 0,
  recentlyAdded: [],
};

const Home = () => {
  const [summary, setSummary] = useState<HomeSummary>(emptySummary);
  const [isLoading, setIsLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextSummary = await getHomeSummary();
      setSummary(nextSummary);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSummary();
    }, [loadSummary]),
  );

  const handleStartReview = () => {
    router.push('/review');
  };

  const handleAddVocabulary = () => {
    router.push('/vocabulary/new');
  };

  const reviewDescription =
    summary.dueReviewCount === 1
      ? '1 card is waiting for you'
      : `${summary.dueReviewCount} cards are waiting for you`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={[commonStyles.row, commonStyles.spaceBetween, styles.header]}>
          <View>
            <Heading>My Arabic</Heading>
            <BodyText style={styledTextSpacing.subtitle}>
              Keep learning, one word at a time.
            </BodyText>
          </View>

          <View style={[commonStyles.centered, styles.profile]}>
            <Text style={styles.profileText}>م</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.vocabularyCard,
            commonStyles.row,
            commonStyles.spaceBetween,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push('/vocabulary')}
        >
          <View>
            <Text style={styles.cardLabel}>Vocabulary</Text>
            <Text style={styles.cardValue}>
              {isLoading ? '—' : summary.totalWords}
            </Text>
            <Text style={styles.cardDescription}>words learned</Text>
          </View>

          <Text style={styles.arabicDecoration}>كلمات</Text>
        </Pressable>

        <View style={styles.reviewCard}>
          <View style={[commonStyles.row, commonStyles.alignCenter]}>
            <View style={[commonStyles.centered, styles.reviewIcon]}>
              <Text style={styles.reviewIconText}>↻</Text>
            </View>

            <View style={[commonStyles.grow, styles.reviewContent]}>
              <Subheading>Review</Subheading>
              <BodyText style={styledTextSpacing.sectionDescription}>
                {isLoading ? 'Loading cards…' : reviewDescription}
              </BodyText>
            </View>
          </View>

          <Pressable
            onPress={handleStartReview}
            style={({ pressed }) => [
              styles.primaryButton,
              commonStyles.row,
              commonStyles.spaceBetween,
              commonStyles.alignCenter,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Start Review</Text>
            <AppIcon
              name="arrowRight"
              size={ICON_SIZES.lg}
              color={COLORS.textOnPrimary}
              weight="bold"
            />
          </Pressable>
        </View>

        <View
          style={[
            commonStyles.row,
            commonStyles.spaceBetween,
            commonStyles.alignCenter,
            styles.sectionHeader,
          ]}
        >
          <Subheading>Recently Added</Subheading>

          <Pressable onPress={() => router.push('/vocabulary')}>
            <Text style={styles.linkText}>View all</Text>
          </Pressable>
        </View>

        <View style={styles.wordsContainer}>
          {isLoading ? (
            <View style={[styles.wordRow, commonStyles.centered]}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : null}

          {!isLoading && summary.recentlyAdded.length === 0 ? (
            <View style={styles.emptyRecent}>
              <BodyText>No words yet. Add your first vocabulary card.</BodyText>
            </View>
          ) : null}

          {!isLoading
            ? summary.recentlyAdded.map((item, index) => (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(`/vocabulary/${item.id}`)}
                  style={({ pressed }) => [
                    styles.wordRow,
                    commonStyles.row,
                    commonStyles.alignCenter,
                    index !== summary.recentlyAdded.length - 1 && styles.wordRowBorder,
                    pressed && styles.wordRowPressed,
                  ]}
                >
                  <View style={[commonStyles.centered, styles.wordIcon]}>
                    <Text style={styles.wordIconText}>{index + 1}</Text>
                  </View>

                  <View style={styles.entryTextRow}>
                    <Text style={styles.meaning} numberOfLines={1}>
                      {item.meaning}
                    </Text>
                    <Text style={styles.arabicWord} numberOfLines={1}>
                      {item.arabicWord}
                    </Text>
                  </View>
                </Pressable>
              ))
            : null}
        </View>

        <Pressable
          onPress={handleAddVocabulary}
          style={({ pressed }) => [
            styles.addButton,
            commonStyles.row,
            commonStyles.centered,
            pressed && styles.addButtonPressed,
          ]}
        >
          <View style={[commonStyles.centered, styles.addButtonIconWrap]}>
            <AppIcon
              name="plus"
              size={ICON_SIZES.lg}
              color={COLORS.primary}
              weight="bold"
            />
          </View>
          <Text style={styles.addButtonText}>Add Vocabulary</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const cardShadow = createShadow(2, COLORS.accent, 0.06, 4);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.section,
  },

  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },

  profile: {
    width: SIZES.profile,
    height: SIZES.profile,
    borderRadius: SIZES.profile / 2,
    backgroundColor: COLORS.surfaceProfile,
  },

  profileText: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryLight,
  },

  vocabularyCard: {
    minHeight: SIZES.vocabularyCardMinHeight,
    padding: SPACING.lg + 2,
    borderRadius: BORDER_RADIUS.hero,
    backgroundColor: COLORS.primaryDark,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },

  cardLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textOnDarkCard,
  },

  cardValue: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.stat,
    lineHeight: 46,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.textOnPrimary,
  },

  cardDescription: {
    marginTop: 2,
    fontSize: FONT_SIZES.md,
    color: COLORS.textOnDarkCardMuted,
  },

  arabicDecoration: {
    position: 'absolute',
    right: -SPACING.sm,
    bottom: -14,
    fontSize: FONT_SIZES.decoration,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.decorationOverlay,
  },

  reviewCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.card,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xxxl,
    ...cardShadow,
  },

  reviewIcon: {
    width: SIZES.reviewIcon,
    height: SIZES.reviewIcon,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
  },

  reviewIconText: {
    fontSize: 23,
    color: COLORS.primary,
  },

  reviewContent: {
    marginLeft: SPACING.md - 2,
  },

  primaryButton: {
    height: SIZES.primaryButtonHeight,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg - 2,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primary,
  },

  primaryButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  primaryButtonText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textOnPrimary,
  },

  sectionHeader: {
    marginBottom: SPACING.sm + SPACING.xs,
  },

  linkText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },

  wordsContainer: {
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
    ...cardShadow,
  },

  wordRow: {
    minHeight: SIZES.wordRowMinHeight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignSelf: 'stretch',
  },

  wordRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },

  wordRowPressed: {
    backgroundColor: COLORS.surfacePressed,
  },

  wordIcon: {
    width: SIZES.wordIcon,
    height: SIZES.wordIcon,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceWordIcon,
  },

  wordIconText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.wordIconText,
  },

  entryTextRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginLeft: SPACING.md,
    minWidth: 0,
  },

  arabicWord: {
    flexShrink: 0,
    fontSize: FONT_SIZES.display,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.arabicWord,
    textAlign: 'right',
  },

  meaning: {
    flex: 1,
    flexShrink: 1,
    fontSize: FONT_SIZES.display,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textMutedSecondary,
    textAlign: 'left',
  },

  addButton: {
    height: SIZES.addButtonHeight,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.addButtonBorder,
    backgroundColor: COLORS.surfaceAddButton,
    gap: SPACING.sm,
  },

  addButtonPressed: {
    backgroundColor: COLORS.surfaceAddButtonPressed,
  },

  addButtonIconWrap: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceMuted,
  },

  addButtonText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },

  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },

  emptyRecent: {
    padding: SPACING.lg,
  },
});

export default Home;
