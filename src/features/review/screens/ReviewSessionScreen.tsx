import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
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
import { MAX_VOCABULARY_EXAMPLES } from '@/features/vocabulary/constants';
import { toReviewErrorMessage } from '@/features/review/services/reviewErrors';
import {
  getActiveReviewSession,
  submitReviewResponse,
} from '@/features/review/services/reviewService';
import type { ActiveReviewSession, ReviewResult } from '@/features/review/types';
import { createShadow } from '@/helpers/styleHelpers';
import { appAlert } from '@/utils/appAlert';
import { commonStyles } from '@/styles/commonStyles';

type ReviewSessionScreenProps = {
  sessionId: string;
};

type ReviewCardItem = ActiveReviewSession['cards'][number];

type SessionTally = {
  known: number;
  unknown: number;
};

const CONTENT_MAX_WIDTH = 640;
const COMPACT_MAX_WIDTH = 360;
const MAX_FONT_SCALE = 1.4;

function displayPromptText(card: ReviewCardItem): string {
  const { vocabulary, reviewDirection } = card;
  if (reviewDirection === 'arabic_to_meaning') {
    return vocabulary.arabicWord.trim() || '—';
  }

  return vocabulary.meaning.trim() || '—';
}

function displayAnswerText(card: ReviewCardItem): string {
  const { vocabulary, reviewDirection } = card;
  if (reviewDirection === 'arabic_to_meaning') {
    return vocabulary.meaning.trim() || '—';
  }

  return vocabulary.arabicWord.trim() || '—';
}

export function ReviewSessionScreen({ sessionId }: ReviewSessionScreenProps) {
  const [sessionState, setSessionState] = useState<ActiveReviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [submittingResult, setSubmittingResult] = useState<ReviewResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedTotal, setCompletedTotal] = useState<number | null>(null);
  const [tally, setTally] = useState<SessionTally>({ known: 0, unknown: 0 });

  const { width } = useWindowDimensions();
  const isCompact = width < COMPACT_MAX_WIDTH;

  const isSubmitting = submittingResult !== null;

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const active = await getActiveReviewSession(sessionId);
      if (!active) {
        setIsCompleted(true);
        setSessionState(null);
        return;
      }

      setSessionState(active);
      setIsCompleted(false);
    } catch (error: unknown) {
      setLoadError(toReviewErrorMessage(error, 'Could not load this review session.'));
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useFocusEffect(
    useCallback(() => {
      void loadSession();
    }, [loadSession]),
  );

  const currentCard = sessionState?.cards[0] ?? null;

  const handleReveal = () => {
    if (!currentCard || isRevealed) {
      return;
    }

    setIsRevealed(true);
  };

  const finishSession = (total: number) => {
    setCompletedTotal(total);
    setIsCompleted(true);
    setSessionState(null);
  };

  const handleResponse = async (result: ReviewResult) => {
    if (!currentCard || !sessionState || !isRevealed || isSubmitting) {
      return;
    }

    setSubmittingResult(result);
    setSubmitError(null);

    try {
      const outcome = await submitReviewResponse({
        sessionId: sessionState.session.id,
        vocabularyId: currentCard.vocabularyId,
        result,
      });

      setTally((prev) => ({ ...prev, [result]: prev[result] + 1 }));
      const total = sessionState.session.plan.length;

      if (outcome.sessionCompleted) {
        finishSession(total);
        return;
      }

      const nextSession = await getActiveReviewSession(sessionState.session.id);
      if (!nextSession) {
        finishSession(total);
        return;
      }

      setSessionState(nextSession);
      setIsRevealed(false);
    } catch (error: unknown) {
      setSubmitError(toReviewErrorMessage(error, 'Could not save your answer.'));
    } finally {
      setSubmittingResult(null);
    }
  };

  const confirmExit = () => {
    appAlert(
      'Leave this review?',
      'Your progress is saved. You can continue later from the home screen.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => router.back() },
      ],
    );
  };

  const renderShell = (children: ReactNode, onBack: () => void = () => router.back()) => (
    <ScreenScaffold scroll={false} contentContainerStyle={styles.scaffold}>
      <View style={[commonStyles.grow, styles.container]}>
        <ScreenHeader title="Daily Review" onBack={onBack} />
        {children}
      </View>
    </ScreenScaffold>
  );

  if (isLoading && !sessionState) {
    return renderShell(
      <View style={[commonStyles.grow, commonStyles.centered]}>
        <ActivityIndicator color={COLORS.primary} />
      </View>,
    );
  }

  if (loadError) {
    return renderShell(
      <StateView
        icon="warning"
        iconColor={COLORS.danger}
        iconBackground={COLORS.surfaceDanger}
        title="Could not open review"
        body={loadError}
      >
        <PrimaryButton label="Try again" onPress={() => void loadSession()} />
      </StateView>,
    );
  }

  if (isCompleted) {
    const answered = tally.known + tally.unknown;
    const knownPercent = answered > 0 ? Math.round((tally.known / answered) * 100) : null;

    return renderShell(
      <StateView
        icon="checkmarkCircle"
        title="Review complete"
        body="Nice work! Reviewed words can now appear in quizzes. Come back tomorrow to keep them fresh."
      >
        {answered > 0 ? (
          <View style={[commonStyles.row, styles.summary]}>
            <SummaryStat
              label="Reviewed"
              value={String(completedTotal ?? answered)}
            />
            <SummaryStat label="Knew" value={String(tally.known)} tone="success" />
            <SummaryStat label="Still learning" value={String(tally.unknown)} tone="danger" />
          </View>
        ) : null}

        {knownPercent !== null ? (
          <Text style={styles.summaryCaption} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            You recalled {knownPercent}% of the words you answered this session.
          </Text>
        ) : null}

        <View style={styles.stateActions}>
          <PrimaryButton
            label="Attempt Quiz"
            onPress={() => router.replace('/quiz')}
            trailing={
              <AppIcon
                name="arrowRight"
                size={ICON_SIZES.md}
                color={COLORS.textOnPrimary}
                weight="bold"
              />
            }
          />
          <PrimaryButton
            label="Back to Home"
            variant="secondary"
            onPress={() => router.replace('/')}
          />
        </View>
      </StateView>,
      () => router.replace('/'),
    );
  }

  if (!sessionState || !currentCard) {
    return renderShell(
      <StateView
        icon="checkmarkCircle"
        title="Nothing left to review"
        body="This session has no remaining cards."
      >
        <PrimaryButton label="Back to Home" onPress={() => router.replace('/')} />
      </StateView>,
    );
  }

  const total = sessionState.session.plan.length;
  const position = Math.min(sessionState.completedCount + 1, total);
  const progressPercent = total > 0 ? (sessionState.completedCount / total) * 100 : 0;

  const isArabicPrompt = currentCard.reviewDirection === 'arabic_to_meaning';
  const examples = currentCard.vocabulary.examples.slice(0, MAX_VOCABULARY_EXAMPLES);
  const hasDescription = Boolean(currentCard.vocabulary.description?.trim());
  const hasImage = Boolean(currentCard.vocabulary.imageUri?.trim());
  const hasDetails = hasImage || examples.length > 0 || hasDescription;
  const promptHint = isArabicPrompt
    ? 'What does this word mean?'
    : 'How do you say this in Arabic?';

  return renderShell(
    <>
      <View style={styles.progressBlock}>
        <View style={[commonStyles.row, commonStyles.spaceBetween, commonStyles.alignCenter]}>
          <Text style={styles.progressLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            Card {position} of {total}
          </Text>
          <View style={[commonStyles.row, styles.tally]}>
            <TallyPill icon="checkmarkCircle" value={tally.known} tone="success" />
            <TallyPill icon="xmark" value={tally.unknown} tone="danger" />
          </View>
        </View>
        <View
          style={styles.progressTrack}
          accessibilityRole="progressbar"
          accessibilityLabel={`Card ${position} of ${total}`}
          accessibilityValue={{ min: 0, max: total, now: sessionState.completedCount }}
        >
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      <ScrollView
        key={currentCard.vocabularyId}
        style={commonStyles.grow}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={handleReveal}
          disabled={isRevealed}
          accessibilityRole="button"
          accessibilityLabel={
            isRevealed
              ? `${displayPromptText(currentCard)}. Answer: ${displayAnswerText(currentCard)}`
              : `${displayPromptText(currentCard)}. Tap to reveal the answer`
          }
          style={({ pressed }) => [
            styles.flashcard,
            isCompact && styles.flashcardCompact,
            pressed && !isRevealed && styles.flashcardPressed,
          ]}
        >
          <View style={[commonStyles.row, commonStyles.alignCenter, styles.directionChip]}>
            <Text style={styles.directionChipText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {isArabicPrompt ? 'Arabic → Meaning' : 'Meaning → Arabic'}
            </Text>
          </View>

          <Text style={styles.promptHint} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {promptHint}
          </Text>

          <Text
            style={[
              isArabicPrompt ? styles.promptArabic : styles.promptMeaning,
              isCompact && (isArabicPrompt ? styles.promptArabicCompact : styles.promptMeaningCompact),
            ]}
            maxFontSizeMultiplier={1.3}
          >
            {displayPromptText(currentCard)}
          </Text>

          {!isRevealed ? (
            <View style={[commonStyles.row, commonStyles.centered, styles.revealPlaceholder]}>
              <AppIcon name="eye" size={ICON_SIZES.md} color={COLORS.primary} />
              <Text style={styles.revealHint} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                Tap to reveal the answer
              </Text>
            </View>
          ) : (
            <View style={styles.answerBlock}>
              <Text style={styles.answerLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                Answer
              </Text>
              <Text
                style={[
                  isArabicPrompt ? styles.answerMeaning : styles.answerArabic,
                  isCompact && styles.answerCompact,
                ]}
                maxFontSizeMultiplier={1.3}
              >
                {displayAnswerText(currentCard)}
              </Text>
            </View>
          )}
        </Pressable>

        {isRevealed && hasDetails ? (
          <View style={styles.details}>
            {hasImage ? (
              <View style={styles.imageCard}>
                <Image
                  source={{ uri: currentCard.vocabulary.imageUri }}
                  style={styles.image}
                  contentFit="cover"
                  accessibilityLabel="Vocabulary image"
                />
              </View>
            ) : null}

            {examples.length > 0 ? (
              <DetailSection title="Examples">
                {examples.map((example, index) => (
                  <View
                    key={`${index}-${example.sentence}`}
                    style={[
                      styles.exampleRow,
                      index !== examples.length - 1 && styles.exampleRowBorder,
                    ]}
                  >
                    <Text style={styles.exampleSentence} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                      {example.sentence}
                    </Text>
                    {example.meaning?.trim() ? (
                      <Text style={styles.exampleMeaning} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                        {example.meaning}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </DetailSection>
            ) : null}

            {hasDescription ? (
              <DetailSection title="Notes">
                <Text style={styles.notesText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  {currentCard.vocabulary.description}
                </Text>
              </DetailSection>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {/* Actions */}
      <View style={styles.footer}>
        {submitError ? (
          <View style={[commonStyles.row, commonStyles.alignCenter, styles.footerError]}>
            <AppIcon name="warning" size={ICON_SIZES.sm} color={COLORS.danger} />
            <Text style={styles.footerErrorText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {submitError}
            </Text>
          </View>
        ) : null}

        {!isRevealed ? (
          <PrimaryButton
            label="Show Answer"
            onPress={handleReveal}
            leading={<AppIcon name="eye" size={ICON_SIZES.md} color={COLORS.textOnPrimary} />}
          />
        ) : (
          <>
            <Text style={styles.footerPrompt} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              Did you remember it?
            </Text>
            <View style={[styles.responseRow, isCompact && styles.responseRowCompact]}>
              <PrimaryButton
                label="Didn't know"
                variant="danger"
                onPress={() => void handleResponse('unknown')}
                disabled={isSubmitting && submittingResult !== 'unknown'}
                loading={submittingResult === 'unknown'}
                leading={
                  submittingResult === 'unknown' ? null : (
                    <AppIcon name="xmark" size={ICON_SIZES.sm} color={COLORS.danger} weight="bold" />
                  )
                }
                style={styles.responseButton}
              />
              <PrimaryButton
                label="Knew it"
                onPress={() => void handleResponse('known')}
                disabled={isSubmitting && submittingResult !== 'known'}
                loading={submittingResult === 'known'}
                leading={
                  submittingResult === 'known' ? null : (
                    <AppIcon
                      name="checkmarkCircle"
                      size={ICON_SIZES.md}
                      color={COLORS.textOnPrimary}
                    />
                  )
                }
                style={styles.responseButton}
              />
            </View>
          </>
        )}
      </View>
    </>,
    confirmExit,
  );
}

type Tone = 'success' | 'danger';

function TallyPill({ icon, value, tone }: { icon: AppIconName; value: number; tone: Tone }) {
  const color = tone === 'success' ? COLORS.primary : COLORS.danger;

  return (
    <View
      style={[
        commonStyles.row,
        commonStyles.alignCenter,
        styles.tallyPill,
        tone === 'success' ? styles.tallyPillSuccess : styles.tallyPillDanger,
      ]}
      accessibilityLabel={`${value} ${tone === 'success' ? 'known' : 'not known'}`}
    >
      <AppIcon name={icon} size={ICON_SIZES.sm - 4} color={color} weight="bold" />
      <Text style={[styles.tallyText, { color }]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
        {value}
      </Text>
    </View>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone?: Tone }) {
  return (
    <View style={styles.summaryStat}>
      <Text
        style={[
          styles.summaryValue,
          tone === 'success' && styles.summaryValueSuccess,
          tone === 'danger' && styles.summaryValueDanger,
        ]}
        maxFontSizeMultiplier={1.2}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text
        style={styles.summaryLabel}
        maxFontSizeMultiplier={1.2}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
    </View>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
        {title}
      </Text>
      <View style={styles.detailCard}>{children}</View>
    </View>
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
    <ScrollView
      style={commonStyles.grow}
      contentContainerStyle={[commonStyles.centered, styles.state]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[commonStyles.centered, styles.stateIcon, { backgroundColor: iconBackground }]}>
        <AppIcon name={icon} size={36} color={iconColor} />
      </View>
      <Text style={styles.stateTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
        {title}
      </Text>
      <Text style={styles.stateBody} maxFontSizeMultiplier={MAX_FONT_SCALE}>
        {body}
      </Text>
      {children}
    </ScrollView>
  );
}

const cardShadow = createShadow(3, COLORS.accent, 0.08, 14, { width: 0, height: 6 });

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
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.lg,
  },

  // Progress
  progressBlock: {
    marginTop: -SPACING.xs,
    marginBottom: SPACING.md,
  },
  progressLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  tally: {
    gap: SPACING.xs + 2,
  },
  tallyPill: {
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
  },
  tallyPillSuccess: {
    backgroundColor: COLORS.surfaceSuccess,
  },
  tallyPillDanger: {
    backgroundColor: COLORS.surfaceDanger,
  },
  tallyText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
  },
  progressTrack: {
    height: SIZES.quizTimerTrackHeight + 2,
    marginTop: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary,
  },

  // Flashcard
  flashcard: {
    minHeight: 280,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    borderRadius: BORDER_RADIUS.hero,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  flashcardCompact: {
    minHeight: 240,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  flashcardPressed: {
    backgroundColor: COLORS.surfacePressed,
    transform: [{ scale: 0.995 }],
  },
  directionChip: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surfaceMuted,
  },
  directionChipText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  promptHint: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  promptArabic: {
    fontSize: 44,
    lineHeight: 72,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.arabicWord,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  promptArabicCompact: {
    fontSize: 36,
    lineHeight: 60,
  },
  promptMeaning: {
    fontSize: FONT_SIZES.hero + 4,
    lineHeight: 40,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  promptMeaningCompact: {
    fontSize: FONT_SIZES.display,
    lineHeight: 32,
  },
  revealPlaceholder: {
    alignSelf: 'stretch',
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.addButtonBorder,
    backgroundColor: COLORS.surfaceAddButton,
  },
  revealHint: {
    flexShrink: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  answerBlock: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surfaceMuted,
  },
  answerLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  answerMeaning: {
    fontSize: FONT_SIZES.display,
    lineHeight: 32,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    textAlign: 'center',
  },
  answerArabic: {
    fontSize: FONT_SIZES.stat - 6,
    lineHeight: 56,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  answerCompact: {
    fontSize: FONT_SIZES.xxxl + 2,
    lineHeight: 40,
  },

  details: {
    marginTop: SPACING.lg,
    gap: SPACING.lg,
  },
  imageCard: {
    borderRadius: BORDER_RADIUS.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  detailSection: {
    gap: SPACING.sm,
  },
  detailTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: SPACING.xs,
  },
  detailCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  exampleRow: {
    paddingVertical: SPACING.sm,
  },
  exampleRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  exampleSentence: {
    fontSize: FONT_SIZES.xxl + 1,
    lineHeight: 30,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.arabicWord,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  exampleMeaning: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.md,
    lineHeight: 20,
    color: COLORS.textMuted,
  },
  notesText: {
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
    color: COLORS.text,
  },

  // Footer
  footer: {
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  footerPrompt: {
    marginBottom: SPACING.sm + 2,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  footerError: {
    gap: SPACING.xs + 2,
    marginBottom: SPACING.sm + 2,
  },
  footerErrorText: {
    flexShrink: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.danger,
  },
  responseRow: {
    flexDirection: 'row',
    gap: SPACING.sm + 2,
  },
  responseRowCompact: {
    flexDirection: 'column',
  },
  responseButton: {
    flex: 1,
    paddingHorizontal: SPACING.sm + 2,
  },

  state: {
    flexGrow: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xl,
  },
  stateIcon: {
    width: 76,
    height: 76,
    borderRadius: BORDER_RADIUS.round,
    marginBottom: SPACING.lg,
  },
  stateTitle: {
    fontSize: FONT_SIZES.hero - 4,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: SPACING.xs + 2,
  },
  stateBody: {
    fontSize: FONT_SIZES.md,
    lineHeight: 21,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 340,
    marginBottom: SPACING.lg,
  },
  stateActions: {
    alignSelf: 'stretch',
    gap: SPACING.sm + 2,
    marginTop: SPACING.sm,
  },
  summary: {
    alignSelf: 'stretch',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  summaryStat: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  summaryValue: {
    fontSize: FONT_SIZES.hero,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.textDark,
  },
  summaryValueSuccess: {
    color: COLORS.primary,
  },
  summaryValueDanger: {
    color: COLORS.danger,
  },
  summaryLabel: {
    marginTop: 2,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  summaryCaption: {
    marginTop: SPACING.sm + 2,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
