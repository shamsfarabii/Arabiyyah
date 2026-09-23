import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { TextField } from '@/components/ui/TextField';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
} from '@/constants/theme';
import { MIN_QUIZ_VOCABULARY_COUNT } from '@/features/quiz/constants';
import { parseQuestionCount } from '@/features/quiz/schemas/quizSchema';
import { toErrorMessage } from '@/features/quiz/services/quizErrors';
import { getQuizSetupInfo } from '@/features/quiz/services/quizService';
import { commonStyles } from '@/styles/commonStyles';

const DEFAULT_QUESTION_COUNT = 10;
const PRESET_QUESTION_COUNTS = [5, 10, 20];

export function QuizSetupScreen() {
  const [availableCount, setAvailableCount] = useState(0);
  const [totalVocabulary, setTotalVocabulary] = useState(0);
  const [canStart, setCanStart] = useState(false);
  const [questionCountInput, setQuestionCountInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadSetupInfo = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const info = await getQuizSetupInfo();
      setAvailableCount(info.availableCount);
      setTotalVocabulary(info.totalVocabulary);
      setCanStart(info.canStart);
      setQuestionCountInput(
        info.canStart ? String(Math.min(DEFAULT_QUESTION_COUNT, info.availableCount)) : '',
      );
    } catch (error: unknown) {
      setLoadError(toErrorMessage(error, 'Could not load your vocabulary.'));
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
    () => parseQuestionCount(questionCountInput, availableCount),
    [availableCount, questionCountInput],
  );

  const presets = useMemo(
    () =>
      PRESET_QUESTION_COUNTS.filter((preset) => preset <= availableCount).concat(
        PRESET_QUESTION_COUNTS.includes(availableCount) ? [] : [availableCount],
      ),
    [availableCount],
  );

  const handleStart = () => {
    if (!validation.ok) {
      return;
    }

    router.push({
      pathname: '/quiz/session',
      params: { questionCount: String(validation.value) },
    });
  };

  const wordLabel = availableCount === 1 ? 'vocabulary word' : 'vocabulary words';

  return (
    <ScreenScaffold scroll={false}>
      <ScreenHeader title="Attempt Quiz" onBack={() => router.back()} />

      {isLoading ? (
        <View style={[commonStyles.grow, commonStyles.centered]}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : null}

      {!isLoading && loadError ? (
        <View style={[commonStyles.grow, commonStyles.centered, styles.state]}>
          <Text style={styles.stateTitle}>Could not open the quiz</Text>
          <Text style={styles.stateBody}>{loadError}</Text>
          <Pressable onPress={() => void loadSetupInfo()}>
            <Text style={styles.retryLink}>Try again</Text>
          </Pressable>
        </View>
      ) : null}

      {!isLoading && !loadError && !canStart ? (
        <View style={[commonStyles.grow, commonStyles.centered, styles.state]}>
          <Text style={styles.stateTitle}>Not enough vocabulary yet</Text>
          <Text style={styles.stateBody}>
            {totalVocabulary === 0
              ? 'Add vocabulary words first and they will show up here as quiz questions.'
              : availableCount === 0
                ? `Review words in Daily Review before they can appear in a quiz. You have ${totalVocabulary} word${totalVocabulary === 1 ? '' : 's'} waiting.`
                : `A quiz needs at least ${MIN_QUIZ_VOCABULARY_COUNT} reviewed words so every question has a real choice. You have ${availableCount} quiz-ready word${availableCount === 1 ? '' : 's'}.`}
          </Text>
          {totalVocabulary > 0 && availableCount === 0 ? (
            <PrimaryButton
              label="Daily Review"
              onPress={() => router.push('/review')}
              style={styles.stateButton}
            />
          ) : (
            <PrimaryButton
              label="Add Vocabulary"
              onPress={() => router.push('/vocabulary/new')}
              style={styles.stateButton}
            />
          )}
          <PrimaryButton
            label="Back to Vocabulary"
            onPress={() => router.replace('/vocabulary')}
            variant="secondary"
            style={styles.stateButton}
          />
        </View>
      ) : null}

      {!isLoading && !loadError && canStart ? (
        <View style={commonStyles.grow}>
          <View style={styles.availabilityCard}>
            <Text style={styles.availabilityValue}>{availableCount}</Text>
            <Text style={styles.availabilityLabel}>{wordLabel} available</Text>
          </View>

          <TextField
            label="How many questions would you like to attempt?"
            value={questionCountInput}
            onChangeText={setQuestionCountInput}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={5}
            placeholder="e.g. 10"
            errorMessage={validation.ok ? undefined : validation.error}
            accessibilityLabel="Number of questions"
          />

          <Text style={styles.hint}>
            Minimum: 1 · Maximum: {availableCount}
          </Text>

          <View style={[commonStyles.row, styles.presets]}>
            {presets.map((preset) => {
              const isSelected = questionCountInput === String(preset);

              return (
                <Pressable
                  key={preset}
                  onPress={() => setQuestionCountInput(String(preset))}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={({ pressed }) => [
                    styles.preset,
                    isSelected && styles.presetSelected,
                    pressed && styles.presetPressed,
                  ]}
                >
                  <Text style={[styles.presetLabel, isSelected && styles.presetLabelSelected]}>
                    {preset === availableCount ? `All ${preset}` : preset}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.footnote}>
            Only reviewed words are included. Questions favor words you miss most often in quizzes.
          </Text>

          <View style={commonStyles.grow} />

          <PrimaryButton
            label="Start Quiz"
            onPress={handleStart}
            disabled={!validation.ok}
          />
        </View>
      ) : null}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  availabilityCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.card,
    backgroundColor: COLORS.primaryDark,
    marginBottom: SPACING.lg,
  },
  availabilityValue: {
    fontSize: FONT_SIZES.stat,
    lineHeight: 46,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.textOnPrimary,
  },
  availabilityLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textOnDarkCard,
  },
  hint: {
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  presets: {
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  preset: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  presetSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceMuted,
  },
  presetPressed: {
    backgroundColor: COLORS.surfacePressed,
  },
  presetLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textMuted,
  },
  presetLabelSelected: {
    color: COLORS.primary,
  },
  footnote: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  state: {
    paddingHorizontal: SPACING.lg,
  },
  stateTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  stateBody: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  stateButton: {
    alignSelf: 'stretch',
    marginTop: SPACING.sm,
  },
  retryLink: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
});
