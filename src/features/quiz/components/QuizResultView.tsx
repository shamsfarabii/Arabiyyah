import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
} from '@/constants/theme';
import type { QuizAnswerRecord, QuizResult } from '@/features/quiz/types/quiz.types';
import { createShadow } from '@/helpers/styleHelpers';
import { commonStyles } from '@/styles/commonStyles';

type QuizResultViewProps = {
  result: QuizResult;
  onAttemptAnother: () => void;
  onBackToVocabulary: () => void;
};

function answerVerdict(answer: QuizAnswerRecord): string {
  if (answer.wasCorrect) {
    return '✓ Correct';
  }

  return answer.timedOut ? '✗ Timed out' : '✗ Wrong';
}

export function QuizResultView({
  result,
  onAttemptAnother,
  onBackToVocabulary,
}: QuizResultViewProps) {
  const { attempt, answers, accuracyPercent } = result;

  return (
    <View style={commonStyles.grow}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.scoreCard, commonStyles.centered, cardShadow]}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={styles.scoreValue}>
            {attempt.correctAnswers} / {attempt.totalQuestions}
          </Text>

          <View style={[commonStyles.row, styles.statsRow]}>
            <View style={[commonStyles.centered, styles.stat]}>
              <Text style={styles.statValue}>{attempt.correctAnswers}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={[commonStyles.centered, styles.stat]}>
              <Text style={styles.statValue}>{attempt.wrongAnswers}</Text>
              <Text style={styles.statLabel}>Wrong</Text>
            </View>
            <View style={[commonStyles.centered, styles.stat]}>
              <Text style={styles.statValue}>{accuracyPercent}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your answers</Text>

        <View style={styles.answerList}>
          {answers.map((answer, index) => (
            <View
              key={`${answer.position}-${answer.promptWord}`}
              style={[styles.answerRow, index !== answers.length - 1 && styles.answerRowBorder]}
            >
              <View style={[commonStyles.row, commonStyles.spaceBetween, commonStyles.alignCenter]}>
                <Text style={styles.answerIndex}>{answer.position + 1}.</Text>
                <Text style={styles.answerWord}>{answer.promptWord}</Text>
              </View>

              <Text style={styles.answerLine}>
                Your answer: <Text style={styles.answerValue}>{answer.selectedAnswer ?? 'No answer'}</Text>
              </Text>
              <Text style={styles.answerLine}>
                Correct answer: <Text style={styles.answerValue}>{answer.correctAnswer}</Text>
              </Text>

              <Text style={[styles.verdict, answer.wasCorrect ? styles.verdictCorrect : styles.verdictWrong]}>
                {answerVerdict(answer)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <PrimaryButton label="Attempt Another Quiz" onPress={onAttemptAnother} />
        <PrimaryButton
          label="Back to Vocabulary"
          onPress={onBackToVocabulary}
          variant="secondary"
        />
      </View>
    </View>
  );
}

const cardShadow = createShadow(2, COLORS.accent, 0.06, 4);

const styles = StyleSheet.create({
  content: {
    paddingBottom: SPACING.lg,
  },
  scoreCard: {
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.card,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  scoreLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  scoreValue: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.stat,
    lineHeight: 50,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.primaryLight,
  },
  statsRow: {
    alignSelf: 'stretch',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  statValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  answerList: {
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
  },
  answerRow: {
    padding: SPACING.md,
    gap: 2,
  },
  answerRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  answerIndex: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textMuted,
  },
  answerWord: {
    fontSize: FONT_SIZES.display,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.arabicWord,
  },
  answerLine: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  answerValue: {
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  verdict: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  verdictCorrect: {
    color: COLORS.primary,
  },
  verdictWrong: {
    color: COLORS.danger,
  },
  actions: {
    gap: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
});
