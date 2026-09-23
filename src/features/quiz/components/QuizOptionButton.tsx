import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SIZES,
  SPACING,
} from '@/constants/theme';
import { commonStyles } from '@/styles/commonStyles';

export type QuizOptionState = 'idle' | 'correct' | 'incorrect' | 'muted';

type QuizOptionButtonProps = {
  letter: string;
  label: string;
  state: QuizOptionState;
  disabled: boolean;
  onPress: () => void;
};

export function QuizOptionButton({
  letter,
  label,
  state,
  disabled,
  onPress,
}: QuizOptionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={`Option ${letter}: ${label}`}
      style={({ pressed }) => [
        styles.option,
        commonStyles.row,
        commonStyles.alignCenter,
        state === 'correct' && styles.optionCorrect,
        state === 'incorrect' && styles.optionIncorrect,
        state === 'muted' && styles.optionMuted,
        pressed && !disabled && styles.optionPressed,
      ]}
    >
      <View
        style={[
          styles.badge,
          commonStyles.centered,
          state === 'correct' && styles.badgeCorrect,
          state === 'incorrect' && styles.badgeIncorrect,
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            state === 'correct' && styles.badgeTextOnFilled,
            state === 'incorrect' && styles.badgeTextOnFilled,
          ]}
        >
          {letter}
        </Text>
      </View>

      <Text
        style={[
          styles.label,
          state === 'correct' && styles.labelCorrect,
          state === 'incorrect' && styles.labelIncorrect,
          state === 'muted' && styles.labelMuted,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: SIZES.quizOptionMinHeight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    gap: SPACING.md,
  },
  optionPressed: {
    backgroundColor: COLORS.surfacePressed,
    transform: [{ scale: 0.995 }],
  },
  optionCorrect: {
    borderColor: COLORS.borderSuccess,
    backgroundColor: COLORS.surfaceSuccess,
  },
  optionIncorrect: {
    borderColor: COLORS.borderDanger,
    backgroundColor: COLORS.surfaceDanger,
  },
  optionMuted: {
    opacity: 0.6,
  },
  badge: {
    width: SIZES.quizOptionBadge,
    height: SIZES.quizOptionBadge,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceMuted,
  },
  badgeCorrect: {
    backgroundColor: COLORS.primary,
  },
  badgeIncorrect: {
    backgroundColor: COLORS.danger,
  },
  badgeText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  badgeTextOnFilled: {
    color: COLORS.textOnPrimary,
  },
  label: {
    flex: 1,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  labelCorrect: {
    color: COLORS.primaryLight,
  },
  labelIncorrect: {
    color: COLORS.danger,
  },
  labelMuted: {
    color: COLORS.textMuted,
  },
});
