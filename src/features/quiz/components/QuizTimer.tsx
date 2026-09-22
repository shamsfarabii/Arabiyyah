import { StyleSheet, Text, View } from 'react-native';

import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SIZES,
  SPACING,
} from '@/constants/theme';
import { commonStyles } from '@/styles/commonStyles';

const WARNING_THRESHOLD_SECONDS = 3;

type QuizTimerProps = {
  remainingSeconds: number;
  totalSeconds: number;
  isRunning: boolean;
};

export function QuizTimer({ remainingSeconds, totalSeconds, isRunning }: QuizTimerProps) {
  const safeTotal = Math.max(totalSeconds, 1);
  const ratio = Math.min(Math.max(remainingSeconds / safeTotal, 0), 1);
  const isWarning = isRunning && remainingSeconds <= WARNING_THRESHOLD_SECONDS;

  return (
    <View style={styles.wrapper}>
      <View style={[commonStyles.row, commonStyles.spaceBetween, commonStyles.alignCenter]}>
        <Text style={styles.label}>{isRunning ? 'Time left' : 'Time up'}</Text>
        <Text
          style={[styles.seconds, isWarning && styles.secondsWarning]}
          accessibilityLabel={`${remainingSeconds} seconds left`}
        >
          {remainingSeconds}s
        </Text>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            isWarning && styles.fillWarning,
            { width: `${Math.round(ratio * 100)}%` },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  seconds: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  secondsWarning: {
    color: COLORS.danger,
  },
  track: {
    height: SIZES.quizTimerTrackHeight,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary,
  },
  fillWarning: {
    backgroundColor: COLORS.danger,
  },
});
