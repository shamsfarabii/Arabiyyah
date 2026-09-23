import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  ICON_SIZES,
  SIZES,
  SPACING,
} from '@/constants/theme';
import {
  DAILY_REVIEW_PRESET_COUNTS,
  DEFAULT_DAILY_REVIEW_COUNT,
  ESTIMATED_SECONDS_PER_CARD,
  MIN_DAILY_REVIEW_COUNT,
} from '@/features/review/constants';
import { parseReviewCount } from '@/features/review/schemas/reviewSchema';
import { toReviewErrorMessage } from '@/features/review/services/reviewErrors';
import { getReviewHomeState, startDailyReview } from '@/features/review/services/reviewService';
import { createShadow } from '@/helpers/styleHelpers';
import { commonStyles } from '@/styles/commonStyles';

const CONTENT_MAX_WIDTH = 640;
const MAX_FONT_SCALE = 1.4;

const HOW_IT_WORKS: { icon: AppIconName; title: string; body: string }[] = [
  {
    icon: 'book',
    title: 'See the word',
    body: 'Cards show either the Arabic word or its meaning first.',
  },
  {
    icon: 'eye',
    title: 'Recall, then reveal',
    body: 'Think of the answer, then tap the card to check yourself.',
  },
  {
    icon: 'checkmarkCircle',
    title: 'Rate yourself',
    body: 'Reviewed words unlock for quizzes.',
  },
];

type ResumeInfo = {
  sessionId: string;
  completedCount: number;
  totalCount: number;
};

function formatEstimate(cardCount: number) {
  const minutes = Math.max(1, Math.round((cardCount * ESTIMATED_SECONDS_PER_CARD) / 60));
  return `~${minutes} min`;
}

export function ReviewSetupScreen() {
  const [availableCount, setAvailableCount] = useState(0);
  const [quizEligibleCount, setQuizEligibleCount] = useState(0);
  const [cardCountInput, setCardCountInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [resume, setResume] = useState<ResumeInfo | null>(null);

  const loadSetupInfo = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const state = await getReviewHomeState();
      setAvailableCount(state.totalVocabulary);
      setQuizEligibleCount(state.quizEligibleCount);

      const active = state.activeSession;
      if (active) {
        setResume({
          sessionId: active.session.id,
          completedCount: active.completedCount,
          totalCount: active.session.plan.length,
        });
      } else {
        setResume(null);
        setCardCountInput(
          state.totalVocabulary > 0
            ? String(Math.min(DEFAULT_DAILY_REVIEW_COUNT, state.totalVocabulary))
            : '',
        );
      }
    } catch (error: unknown) {
      setLoadError(toReviewErrorMessage(error, 'Could not load your vocabulary.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSetupInfo();
    }, [loadSetupInfo]),
  );

  const validation = useMemo(
    () => parseReviewCount(cardCountInput, availableCount),
    [availableCount, cardCountInput],
  );

  const presets = useMemo(() => {
    const presetValues: number[] = DAILY_REVIEW_PRESET_COUNTS.filter(
      (preset) => preset < availableCount,
    );
    return availableCount > 0 ? [...presetValues, availableCount] : presetValues;
  }, [availableCount]);

  const currentCount = validation.ok ? validation.value : null;

  const stepCount = (delta: number) => {
    const base = Number.parseInt(cardCountInput, 10);
    const start = Number.isFinite(base) ? base : MIN_DAILY_REVIEW_COUNT;
    const next = Math.min(availableCount, Math.max(MIN_DAILY_REVIEW_COUNT, start + delta));
    setCardCountInput(String(next));
  };

  const handleCountInput = (text: string) => {
    setCardCountInput(text.replace(/[^0-9]/g, ''));
  };

  const handleContinue = () => {
    if (!resume) {
      return;
    }

    router.push({
      pathname: '/review/session',
      params: { sessionId: resume.sessionId },
    });
  };

  const handleStart = async () => {
    if (!validation.ok || isStarting) {
      return;
    }

    setIsStarting(true);
    setStartError(null);

    try {
      const session = await startDailyReview(validation.value);
      router.push({
        pathname: '/review/session',
        params: { sessionId: session.session.id },
      });
    } catch (error: unknown) {
      setStartError(toReviewErrorMessage(error, 'Could not start the review.'));
    } finally {
      setIsStarting(false);
    }
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={[commonStyles.grow, commonStyles.centered]}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      );
    }

    if (loadError) {
      return (
        <StateView
          icon="warning"
          iconColor={COLORS.danger}
          iconBackground={COLORS.surfaceDanger}
          title="Could not open review"
          body={loadError}
        >
          <PrimaryButton
            label="Try again"
            variant="secondary"
            onPress={() => void loadSetupInfo()}
            style={styles.stateButton}
          />
        </StateView>
      );
    }

    if (availableCount === 0) {
      return (
        <StateView
          icon="book"
          title="No vocabulary yet"
          body="Add a few words first, then come back to review them before they appear in a quiz."
        >
          <PrimaryButton
            label="Add Vocabulary"
            onPress={() => router.push('/vocabulary/new')}
            style={styles.stateButton}
          />
        </StateView>
      );
    }

    if (resume) {
      const percent =
        resume.totalCount > 0
          ? Math.round((resume.completedCount / resume.totalCount) * 100)
          : 0;
      const remaining = resume.totalCount - resume.completedCount;

      return (
        <>
          <ScrollView
            style={commonStyles.grow}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroCard}>
              <Text style={styles.heroDecoration} maxFontSizeMultiplier={1} aria-hidden>
                مراجعة
              </Text>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  In progress
                </Text>
              </View>
              <View style={[commonStyles.row, styles.heroValueRow]}>
                <Text style={styles.heroValue} maxFontSizeMultiplier={1.2}>
                  {resume.completedCount}
                </Text>
                <Text style={styles.heroValueUnit} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  of {resume.totalCount} cards reviewed
                </Text>
              </View>

              <View
                style={styles.heroTrack}
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: 100, now: percent }}
              >
                <View style={[styles.heroFill, { width: `${percent}%` }]} />
              </View>

              <View style={[commonStyles.row, commonStyles.spaceBetween, styles.heroMeta]}>
                <Text style={styles.heroMetaText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  {percent}% complete
                </Text>
                <Text style={styles.heroMetaText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  {remaining} left · {formatEstimate(remaining)}
                </Text>
              </View>
            </View>

            <Text style={styles.helperText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              Pick up right where you left off. Your answers so far are saved, and each word
              appears only once per session.
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <PrimaryButton
              label="Continue Review"
              onPress={handleContinue}
              trailing={
                <AppIcon
                  name="arrowRight"
                  size={ICON_SIZES.md}
                  color={COLORS.textOnPrimary}
                  weight="bold"
                />
              }
            />
          </View>
        </>
      );
    }

    return (
      <>
        <ScrollView
          style={commonStyles.grow}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Overview */}
          <View style={styles.heroCard}>
            <Text style={styles.heroDecoration} maxFontSizeMultiplier={1} aria-hidden>
              مراجعة
            </Text>
            <Text style={styles.heroLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              Your collection
            </Text>

            <View style={[commonStyles.row, styles.heroStats]}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue} maxFontSizeMultiplier={1.2} numberOfLines={1}>
                  {availableCount}
                </Text>
                <Text style={styles.heroStatLabel} maxFontSizeMultiplier={1.2} numberOfLines={1}>
                  {availableCount === 1 ? 'Word' : 'Words'} available
                </Text>
              </View>
              <View style={[styles.heroStat, styles.heroStatDivider]}>
                <Text style={styles.heroStatValue} maxFontSizeMultiplier={1.2} numberOfLines={1}>
                  {quizEligibleCount}
                </Text>
                <Text style={styles.heroStatLabel} maxFontSizeMultiplier={1.2} numberOfLines={1}>
                  Ready for quiz
                </Text>
              </View>
            </View>
          </View>

          {/* Card count picker */}
          <View style={styles.card}>
            <Text style={styles.cardTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              How many cards?
            </Text>
            <Text style={styles.cardSubtitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              Choose between {MIN_DAILY_REVIEW_COUNT} and {availableCount}.
            </Text>

            <View style={[commonStyles.row, commonStyles.alignCenter, styles.stepper]}>
              <StepperButton
                icon="minus"
                label="Decrease card count"
                disabled={currentCount !== null && currentCount <= MIN_DAILY_REVIEW_COUNT}
                onPress={() => stepCount(-1)}
              />

              <View style={[commonStyles.grow, commonStyles.centered]}>
                <TextInput
                  value={cardCountInput}
                  onChangeText={handleCountInput}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="0"
                  placeholderTextColor={COLORS.chevron}
                  selectTextOnFocus
                  style={[styles.stepperInput, !validation.ok && styles.stepperInputError]}
                  maxFontSizeMultiplier={1.2}
                  accessibilityLabel="Number of review cards"
                />
                <Text style={styles.stepperUnit} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  {currentCount === 1 ? 'card' : 'cards'}
                  {currentCount !== null ? ` · ${formatEstimate(currentCount)}` : ''}
                </Text>
              </View>

              <StepperButton
                icon="plus"
                label="Increase card count"
                disabled={currentCount !== null && currentCount >= availableCount}
                onPress={() => stepCount(1)}
              />
            </View>

            {!validation.ok ? (
              <View style={[commonStyles.row, commonStyles.alignCenter, styles.inlineError]}>
                <AppIcon name="warning" size={ICON_SIZES.sm} color={COLORS.danger} />
                <Text style={styles.inlineErrorText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  {validation.error}
                </Text>
              </View>
            ) : null}

            <View style={[commonStyles.row, styles.presets]}>
              {presets.map((preset) => {
                const isSelected = currentCount === preset;
                const isAll = preset === availableCount;

                return (
                  <Pressable
                    key={preset}
                    onPress={() => setCardCountInput(String(preset))}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={isAll ? `All ${preset} cards` : `${preset} cards`}
                    style={({ pressed }) => [
                      styles.preset,
                      isSelected && styles.presetSelected,
                      pressed && !isSelected && styles.presetPressed,
                    ]}
                  >
                    <Text
                      style={[styles.presetLabel, isSelected && styles.presetLabelSelected]}
                      maxFontSizeMultiplier={MAX_FONT_SCALE}
                      numberOfLines={1}
                    >
                      {isAll ? `All (${preset})` : preset}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* How it works */}
          <Text style={styles.sectionTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            How it works
          </Text>
          <View style={styles.stepsCard}>
            {HOW_IT_WORKS.map((step, index) => (
              <View
                key={step.title}
                style={[
                  commonStyles.row,
                  styles.stepRow,
                  index !== HOW_IT_WORKS.length - 1 && styles.stepRowBorder,
                ]}
              >
                <View style={[commonStyles.centered, styles.stepIcon]}>
                  <AppIcon name={step.icon} size={ICON_SIZES.md} color={COLORS.primary} />
                </View>
                <View style={[commonStyles.grow, styles.stepText]}>
                  <Text style={styles.stepTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    {step.title}
                  </Text>
                  <Text style={styles.stepBody} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    {step.body}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {startError ? (
            <View style={[commonStyles.row, commonStyles.alignCenter, styles.footerError]}>
              <AppIcon name="warning" size={ICON_SIZES.sm} color={COLORS.danger} />
              <Text style={styles.inlineErrorText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {startError}
              </Text>
            </View>
          ) : null}
          <PrimaryButton
            label={currentCount !== null ? `Start Review · ${currentCount}` : 'Start Review'}
            onPress={() => void handleStart()}
            disabled={!validation.ok}
            loading={isStarting}
            trailing={
              isStarting ? null : (
                <AppIcon
                  name="arrowRight"
                  size={ICON_SIZES.md}
                  color={COLORS.textOnPrimary}
                  weight="bold"
                />
              )
            }
          />
        </View>
      </>
    );
  };

  return (
    <ScreenScaffold scroll={false} contentContainerStyle={styles.scaffold}>
      <KeyboardAvoidingView
        style={[commonStyles.grow, styles.container]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenHeader title="Daily Review" onBack={() => router.back()} />
        {renderBody()}
      </KeyboardAvoidingView>
    </ScreenScaffold>
  );
}

type StepperButtonProps = {
  icon: AppIconName;
  label: string;
  disabled: boolean;
  onPress: () => void;
};

function StepperButton({ icon, label, disabled, onPress }: StepperButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        commonStyles.centered,
        styles.stepperButton,
        disabled && styles.stepperButtonDisabled,
        pressed && !disabled && styles.stepperButtonPressed,
      ]}
    >
      <AppIcon name={icon} size={ICON_SIZES.lg} color={COLORS.primary} weight="bold" />
    </Pressable>
  );
}

type StateViewProps = {
  icon: AppIconName;
  iconColor?: string;
  iconBackground?: string;
  title: string;
  body: string;
  children?: ReactNode;
};

function StateView({
  icon,
  iconColor = COLORS.primary,
  iconBackground = COLORS.surfaceMuted,
  title,
  body,
  children,
}: StateViewProps) {
  return (
    <View style={[commonStyles.grow, commonStyles.centered, styles.state]}>
      <View style={[commonStyles.centered, styles.stateIcon, { backgroundColor: iconBackground }]}>
        <AppIcon name={icon} size={ICON_SIZES.xxl} color={iconColor} />
      </View>
      <Text style={styles.stateTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
        {title}
      </Text>
      <Text style={styles.stateBody} maxFontSizeMultiplier={MAX_FONT_SCALE}>
        {body}
      </Text>
      {children}
    </View>
  );
}

const cardShadow = createShadow(2, COLORS.accent, 0.06, 10, { width: 0, height: 4 });
const heroShadow = createShadow(6, COLORS.accent, 0.2, 16, { width: 0, height: 8 });

const styles = StyleSheet.create({
  scaffold: {
    paddingBottom: SPACING.md,
  },
  container: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  scrollContent: {
    paddingBottom: SPACING.lg,
  },

  // Hero
  heroCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.hero,
    backgroundColor: COLORS.primaryDark,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    ...heroShadow,
  },
  heroDecoration: {
    position: 'absolute',
    right: -SPACING.sm,
    bottom: -SPACING.md,
    fontSize: FONT_SIZES.decoration,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.decorationOverlay,
  },
  heroLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textOnDarkCard,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textOnDarkCard,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroValueRow: {
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: SPACING.sm,
    marginTop: SPACING.md,
  },
  heroValue: {
    fontSize: FONT_SIZES.stat,
    lineHeight: FONT_SIZES.stat + 8,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.textOnPrimary,
    letterSpacing: -1,
  },
  heroValueUnit: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textOnDarkCardMuted,
  },
  heroTrack: {
    height: 8,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  heroFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.secondary,
  },
  heroMeta: {
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  heroMetaText: {
    flexShrink: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textOnDarkCardMuted,
  },
  heroStats: {
    marginTop: SPACING.md,
  },
  heroStat: {
    flex: 1,
    minWidth: 0,
  },
  heroStatDivider: {
    paddingLeft: SPACING.md,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(255,255,255,0.2)',
  },
  heroStatValue: {
    fontSize: FONT_SIZES.stat - 8,
    lineHeight: FONT_SIZES.stat,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.textOnPrimary,
  },
  heroStatLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textOnDarkCardMuted,
  },

  // Count picker
  card: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    marginBottom: SPACING.xl,
    ...cardShadow,
  },
  cardTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  stepper: {
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  stepperButton: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepperButtonPressed: {
    backgroundColor: COLORS.surfaceAddButtonPressed,
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  stepperInput: {
    minWidth: 96,
    paddingVertical: 0,
    fontSize: FONT_SIZES.stat,
    lineHeight: FONT_SIZES.stat + 8,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  stepperInputError: {
    color: COLORS.danger,
  },
  stepperUnit: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textMuted,
  },
  inlineError: {
    marginTop: SPACING.md,
    gap: SPACING.xs + 2,
  },
  inlineErrorText: {
    flexShrink: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.danger,
  },
  presets: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  preset: {
    flexGrow: 1,
    flexBasis: 64,
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  presetSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  presetPressed: {
    backgroundColor: COLORS.surfacePressed,
  },
  presetLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  presetLabelSelected: {
    color: COLORS.textOnPrimary,
  },

  // How it works
  sectionTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm + SPACING.xs,
  },
  stepsCard: {
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
  },
  stepRow: {
    padding: SPACING.md,
    gap: SPACING.md - 2,
  },
  stepRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  stepIcon: {
    width: SIZES.iconButton + 4,
    height: SIZES.iconButton + 4,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceMuted,
  },
  stepText: {
    minWidth: 0,
  },
  stepTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  stepBody: {
    marginTop: 2,
    fontSize: FONT_SIZES.sm,
    lineHeight: 19,
    color: COLORS.textMuted,
  },

  helperText: {
    fontSize: FONT_SIZES.md,
    lineHeight: 21,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.xs,
  },

  // Footer
  footer: {
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  footerError: {
    gap: SPACING.xs + 2,
    marginBottom: SPACING.sm + 2,
  },

  // States
  state: {
    paddingHorizontal: SPACING.lg,
  },
  stateIcon: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.round,
    marginBottom: SPACING.md,
  },
  stateTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs + 2,
    textAlign: 'center',
  },
  stateBody: {
    fontSize: FONT_SIZES.md,
    lineHeight: 21,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: SPACING.lg,
  },
  stateButton: {
    alignSelf: 'stretch',
  },
});
