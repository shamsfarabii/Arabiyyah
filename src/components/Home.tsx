import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
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

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { IconButton } from '@/components/ui/IconButton';
import { getHomeSummary } from '@/features/vocabulary/services/vocabularyService';
import type { HomeSummary } from '@/features/vocabulary/types';

const RECENTLY_ADDED_LIMIT = 3;

// Layout breakpoints (dp). Compact covers small phones (iPhone SE, small Androids);
// wide covers large phones in landscape, tablets and web.
const COMPACT_MAX_WIDTH = 360;
const WIDE_MIN_WIDTH = 640;
const CONTENT_MAX_WIDTH = 760;

// Caps OS font scaling on dense UI so large accessibility sizes don't break layout.
const MAX_FONT_SCALE = 1.4;

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

function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const Home = () => {
  const [summary, setSummary] = useState<HomeSummary>(emptySummary);
  const [isLoading, setIsLoading] = useState(true);
  const { width } = useWindowDimensions();

  const isCompact = width < COMPACT_MAX_WIDTH;
  const isWide = width >= WIDE_MIN_WIDTH;

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

  const handleAttemptQuiz = () => {
    router.push('/quiz');
  };

  const handleDailyReview = () => {
    if (summary.review.activeProgress) {
      router.push({
        pathname: '/review/session',
        params: { sessionId: summary.review.activeProgress.sessionId },
      });
      return;
    }

    router.push('/review');
  };

  const handleAddVocabulary = () => {
    router.push('/vocabulary/new');
  };

  const practiceDescription =
    summary.practice.accuracyPercent === null
      ? `Practice your ${summary.totalWords} ${summary.totalWords === 1 ? 'word' : 'words'}`
      : `${summary.practice.answeredCount} answered · ${summary.practice.accuracyPercent}% accuracy`;

  const reviewProgress = summary.review.activeProgress;
  const reviewDescription = reviewProgress
    ? `${reviewProgress.completedCount} / ${reviewProgress.totalCount} reviewed`
    : summary.review.quizEligibleCount === summary.totalWords
      ? 'Review your words before quizzing'
      : `${summary.review.quizEligibleCount} of ${summary.totalWords} ready for quiz`;

  const reviewButtonLabel = reviewProgress ? 'Continue Review' : 'Start Review';
  const isReviewDisabled = isLoading || !summary.review.canStart;
  const reviewPercent =
    reviewProgress && reviewProgress.totalCount > 0
      ? Math.min(100, Math.round((reviewProgress.completedCount / reviewProgress.totalCount) * 100))
      : 0;

  const recentItems = summary.recentlyAdded.slice(0, RECENTLY_ADDED_LIMIT);

  const stats = [
    {
      label: 'Answered',
      value: isLoading ? '—' : String(summary.practice.answeredCount),
    },
    {
      label: 'Accuracy',
      value:
        isLoading || summary.practice.accuracyPercent === null
          ? '—'
          : `${summary.practice.accuracyPercent}%`,
    },
    {
      label: 'Quiz ready',
      value: isLoading ? '—' : String(summary.review.quizEligibleCount),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isCompact && styles.scrollContentCompact,
          isWide && styles.scrollContentWide,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={[commonStyles.row, commonStyles.alignCenter, styles.header]}>
            <View style={styles.headerText}>
              <Text style={styles.greeting} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {getGreeting()}
              </Text>
              <Text
                style={[styles.title, isCompact && styles.titleCompact]}
                maxFontSizeMultiplier={MAX_FONT_SCALE}
                numberOfLines={1}
              >
                My Arabic
              </Text>
              <Text style={styles.subtitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                Keep learning, one word at a time.
              </Text>
            </View>

            <IconButton
              icon="settings"
              accessibilityLabel="Open settings"
              onPress={() => router.push('/settings')}
            />
          </View>

          {/* Hero: vocabulary overview */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Vocabulary, ${summary.totalWords} words collected`}
            onPress={() => router.push('/vocabulary')}
            style={({ pressed }) => [
              styles.heroCard,
              isCompact && styles.heroCardCompact,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.heroDecoration} maxFontSizeMultiplier={1} aria-hidden>
              كلمات
            </Text>

            <View style={[commonStyles.row, commonStyles.alignCenter, commonStyles.spaceBetween]}>
              <View style={[commonStyles.row, commonStyles.alignCenter, styles.heroLabelRow]}>
                <View style={[commonStyles.centered, styles.heroIconChip]}>
                  <AppIcon name="book" size={ICON_SIZES.sm} color={COLORS.textOnPrimary} />
                </View>
                <Text style={styles.heroLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  Vocabulary
                </Text>
              </View>

              <View style={[commonStyles.row, commonStyles.alignCenter, styles.heroLink]}>
                <Text style={styles.heroLinkText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  Open
                </Text>
                <AppIcon
                  name="chevronRight"
                  size={ICON_SIZES.sm - 4}
                  color={COLORS.textOnDarkCard}
                  weight="bold"
                />
              </View>
            </View>

            <View style={[commonStyles.row, styles.heroValueRow]}>
              <Text
                style={[styles.heroValue, isCompact && styles.heroValueCompact]}
                maxFontSizeMultiplier={1.2}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {isLoading ? '—' : summary.totalWords}
              </Text>
              <Text style={styles.heroValueUnit} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {summary.totalWords === 1 ? 'word' : 'words'} collected
              </Text>
            </View>

            <View style={[commonStyles.row, styles.heroStats]}>
              {stats.map((stat, index) => (
                <View
                  key={stat.label}
                  style={[styles.heroStat, index > 0 && styles.heroStatDivider]}
                >
                  <Text
                    style={styles.heroStatValue}
                    maxFontSizeMultiplier={1.2}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {stat.value}
                  </Text>
                  <Text
                    style={styles.heroStatLabel}
                    maxFontSizeMultiplier={1.2}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </Pressable>

          {/* Practice actions */}
          <Text style={styles.sectionTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            Practice
          </Text>

          <View style={[styles.actions, isWide && styles.actionsWide]}>
            <ActionCard
              icon="refresh"
              title="Daily Review"
              description={isLoading ? 'Loading your progress…' : reviewDescription}
              buttonLabel={reviewButtonLabel}
              variant="secondary"
              disabled={isReviewDisabled}
              onPress={handleDailyReview}
              isWide={isWide}
              progressPercent={reviewProgress ? reviewPercent : null}
            />

            <ActionCard
              icon="quiz"
              title="Quiz"
              description={isLoading ? 'Loading your progress…' : practiceDescription}
              buttonLabel="Attempt Quiz"
              variant="primary"
              onPress={handleAttemptQuiz}
              isWide={isWide}
            />
          </View>

          {/* Recently added */}
          <View
            style={[
              commonStyles.row,
              commonStyles.spaceBetween,
              commonStyles.alignCenter,
              styles.sectionHeader,
            ]}
          >
            <Text style={styles.sectionTitleInline} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              Recently Added
            </Text>

            <Pressable
              accessibilityRole="link"
              hitSlop={12}
              onPress={() => router.push('/vocabulary')}
              style={({ pressed }) => pressed && styles.linkPressed}
            >
              <Text style={styles.linkText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                View all
              </Text>
            </Pressable>
          </View>

          <View style={styles.wordsContainer}>
            {isLoading ? (
              <View style={[commonStyles.centered, styles.wordsLoading]}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : null}

            {!isLoading && !recentItems.length ? (
              <View style={[commonStyles.centered, styles.emptyRecent]}>
                <View style={[commonStyles.centered, styles.emptyIcon]}>
                  <AppIcon name="book" size={ICON_SIZES.xl} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  No words yet
                </Text>
                <Text style={styles.emptyBody} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  Add your first vocabulary card to start building your collection.
                </Text>
              </View>
            ) : null}

            {!isLoading
              ? recentItems.map((item, index) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.meaning}, ${item.arabicWord}`}
                    onPress={() => router.push(`/vocabulary/${item.id}`)}
                    style={({ pressed }) => [
                      styles.wordRow,
                      commonStyles.row,
                      commonStyles.alignCenter,
                      index !== recentItems.length - 1 && styles.wordRowBorder,
                      pressed && styles.wordRowPressed,
                    ]}
                  >
                    <Text
                      style={styles.meaning}
                      numberOfLines={1}
                      maxFontSizeMultiplier={MAX_FONT_SCALE}
                    >
                      {item.meaning}
                    </Text>
                    <Text
                      style={[styles.arabicWord, isCompact && styles.arabicWordCompact]}
                      numberOfLines={1}
                      maxFontSizeMultiplier={MAX_FONT_SCALE}
                    >
                      {item.arabicWord}
                    </Text>
                    <AppIcon
                      name="chevronRight"
                      size={ICON_SIZES.sm - 2}
                      color={COLORS.chevron}
                      weight="bold"
                    />
                  </Pressable>
                ))
              : null}
          </View>

          <Pressable
            accessibilityRole="button"
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
                size={ICON_SIZES.md}
                color={COLORS.textOnPrimary}
                weight="bold"
              />
            </View>
            <Text
              style={styles.addButtonText}
              numberOfLines={1}
              maxFontSizeMultiplier={MAX_FONT_SCALE}
            >
              Add Vocabulary
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

type ActionCardProps = {
  icon: AppIconName;
  title: string;
  description: string;
  buttonLabel: string;
  variant: 'primary' | 'secondary';
  onPress: () => void;
  isWide: boolean;
  disabled?: boolean;
  progressPercent?: number | null;
};

function ActionCard({
  icon,
  title,
  description,
  buttonLabel,
  variant,
  onPress,
  isWide,
  disabled = false,
  progressPercent = null,
}: ActionCardProps) {
  const isPrimary = variant === 'primary';

  return (
    <View style={[styles.actionCard, isWide && styles.actionCardWide]}>
      <View style={[commonStyles.row, commonStyles.alignCenter]}>
        <View style={[commonStyles.centered, styles.actionIcon]}>
          <AppIcon name={icon} size={ICON_SIZES.xl} color={COLORS.primary} />
        </View>

        <View style={[commonStyles.grow, styles.actionContent]}>
          <Text style={styles.actionTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {title}
          </Text>
          <Text
            style={styles.actionDescription}
            numberOfLines={2}
            maxFontSizeMultiplier={MAX_FONT_SCALE}
          >
            {description}
          </Text>
        </View>
      </View>

      {progressPercent !== null ? (
        <View
          style={styles.progressTrack}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: progressPercent }}
        >
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          isPrimary ? styles.primaryButton : styles.secondaryButton,
          commonStyles.row,
          commonStyles.spaceBetween,
          commonStyles.alignCenter,
          disabled && styles.buttonDisabled,
          pressed && !disabled && styles.buttonPressed,
        ]}
      >
        <Text
          style={isPrimary ? styles.primaryButtonText : styles.secondaryButtonText}
          numberOfLines={1}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
        >
          {buttonLabel}
        </Text>
        <AppIcon
          name="arrowRight"
          size={ICON_SIZES.md}
          color={isPrimary ? COLORS.textOnPrimary : COLORS.primary}
          weight="bold"
        />
      </Pressable>
    </View>
  );
}

const cardShadow = createShadow(2, COLORS.accent, 0.06, 10, { width: 0, height: 4 });
const heroShadow = createShadow(6, COLORS.accent, 0.22, 18, { width: 0, height: 10 });

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.section + SPACING.md,
  },

  scrollContentCompact: {
    paddingHorizontal: SPACING.md,
  },

  scrollContentWide: {
    paddingHorizontal: SPACING.section,
    paddingTop: SPACING.xl,
  },

  content: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },

  // Header
  header: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  greeting: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  title: {
    marginTop: 2,
    fontSize: FONT_SIZES.hero + 2,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.textDark,
    letterSpacing: -0.8,
  },

  titleCompact: {
    fontSize: FONT_SIZES.display,
  },

  subtitle: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },

  // Hero
  heroCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.hero,
    backgroundColor: COLORS.primaryDark,
    overflow: 'hidden',
    marginBottom: SPACING.xxl,
    ...heroShadow,
  },

  heroCardCompact: {
    padding: SPACING.md,
  },

  heroDecoration: {
    position: 'absolute',
    right: -SPACING.sm,
    top: SPACING.xl,
    fontSize: FONT_SIZES.decoration + 16,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.decorationOverlay,
  },

  heroLabelRow: {
    gap: SPACING.sm,
    flexShrink: 1,
  },

  heroIconChip: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },

  heroLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textOnDarkCard,
  },

  heroLink: {
    gap: 2,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  heroLinkText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textOnDarkCard,
  },

  heroValueRow: {
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: SPACING.sm,
    marginTop: SPACING.md,
  },

  heroValue: {
    fontSize: FONT_SIZES.stat + 6,
    lineHeight: FONT_SIZES.stat + 14,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.textOnPrimary,
    letterSpacing: -1,
  },

  heroValueCompact: {
    fontSize: FONT_SIZES.stat - 4,
    lineHeight: FONT_SIZES.stat + 4,
  },

  heroValueUnit: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textOnDarkCardMuted,
  },

  heroStats: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },

  heroStat: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: SPACING.sm,
  },

  heroStatDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(255,255,255,0.18)',
  },

  heroStatValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textOnPrimary,
  },

  heroStatLabel: {
    marginTop: 2,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textOnDarkCardMuted,
  },

  // Sections
  sectionTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm + SPACING.xs,
  },

  sectionTitleInline: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    flexShrink: 1,
  },

  sectionHeader: {
    gap: SPACING.md,
    marginBottom: SPACING.sm + SPACING.xs,
  },

  linkText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },

  linkPressed: {
    opacity: 0.6,
  },

  // Action cards
  actions: {
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },

  actionsWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  actionCard: {
    gap: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.card,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...cardShadow,
  },

  actionCardWide: {
    flex: 1,
    justifyContent: 'space-between',
    minWidth: 0,
  },

  actionIcon: {
    width: SIZES.practiceIcon,
    height: SIZES.practiceIcon,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
  },

  actionContent: {
    marginLeft: SPACING.md - 2,
    minWidth: 0,
  },

  actionTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },

  actionDescription: {
    marginTop: 3,
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },

  progressTrack: {
    height: SIZES.quizTimerTrackHeight,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surfaceMuted,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary,
  },

  primaryButton: {
    minHeight: SIZES.primaryButtonHeight,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primary,
    gap: SPACING.sm,
  },

  secondaryButton: {
    minHeight: SIZES.primaryButtonHeight,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  primaryButtonText: {
    flexShrink: 1,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textOnPrimary,
  },

  secondaryButtonText: {
    flexShrink: 1,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },

  // Recently added
  wordsContainer: {
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
    ...cardShadow,
  },

  wordsLoading: {
    minHeight: SIZES.wordRowMinHeight,
  },

  wordRow: {
    minHeight: SIZES.wordRowMinHeight - 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.md,
  },

  wordRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },

  wordRowPressed: {
    backgroundColor: COLORS.surfacePressed,
  },

  meaning: {
    flex: 1,
    minWidth: 0,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textMutedSecondary,
    textAlign: 'left',
  },

  arabicWord: {
    flexShrink: 1,
    maxWidth: '55%',
    fontSize: FONT_SIZES.display - 2,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.arabicWord,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  arabicWordCompact: {
    fontSize: FONT_SIZES.xxxl,
  },

  emptyRecent: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },

  emptyIcon: {
    width: SIZES.practiceIcon,
    height: SIZES.practiceIcon,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surfaceMuted,
    marginBottom: SPACING.sm + SPACING.xs,
  },

  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },

  emptyBody: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },

  addButton: {
    minHeight: SIZES.addButtonHeight,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.addButtonBorder,
    backgroundColor: COLORS.surfaceAddButton,
    gap: SPACING.sm + 2,
  },

  addButtonPressed: {
    backgroundColor: COLORS.surfaceAddButtonPressed,
  },

  addButtonIconWrap: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary,
  },

  addButtonText: {
    flexShrink: 1,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
});

export default Home;
