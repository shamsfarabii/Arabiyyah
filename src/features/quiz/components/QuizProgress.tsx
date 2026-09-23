import { StyleSheet, Text, View } from 'react-native';

import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
} from '@/constants/theme';
import { commonStyles } from '@/styles/commonStyles';

type QuizProgressProps = {
  questionNumber: number;
  totalQuestions: number;
  correctCount: number;
  answeredCount: number;
};

export function QuizProgress({
  questionNumber,
  totalQuestions,
  correctCount,
  answeredCount,
}: QuizProgressProps) {
  const completedRatio = totalQuestions === 0 ? 0 : (questionNumber - 1) / totalQuestions;

  return (
    <View style={styles.wrapper}>
      <View style={[commonStyles.row, commonStyles.spaceBetween, commonStyles.alignCenter]}>
        <Text style={styles.position}>
          Question {questionNumber} of {totalQuestions}
        </Text>

        {answeredCount > 0 ? (
          <Text style={styles.score}>
            Score: {correctCount} / {answeredCount}
          </Text>
        ) : null}
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(completedRatio * 100)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  position: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  score: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  track: {
    height: 4,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary,
  },
});
