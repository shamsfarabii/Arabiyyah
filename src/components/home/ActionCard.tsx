import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HOME_MAX_FONT_SCALE } from '@/components/home/homeLayout';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
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

type ActionCardVariant = 'primary' | 'secondary';

type ActionCardProps = {
  icon: AppIconName;
  title: string;
  description: string;
  buttonLabel: string;
  variant: ActionCardVariant;
  onPress: () => void;
  isWide: boolean;
  disabled?: boolean;
  progressPercent?: number | null;
};

const cardShadow = createShadow(2, COLORS.accent, 0.06, 10, { width: 0, height: 4 });

const BUTTON_ICON_COLOR: Record<ActionCardVariant, string> = {
  primary: COLORS.textOnPrimary,
  secondary: COLORS.primary,
};

export function ActionCard({
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
          <Text style={styles.actionTitle} maxFontSizeMultiplier={HOME_MAX_FONT_SCALE}>
            {title}
          </Text>
          <Text
            style={styles.actionDescription}
            numberOfLines={2}
            maxFontSizeMultiplier={HOME_MAX_FONT_SCALE}
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
          maxFontSizeMultiplier={HOME_MAX_FONT_SCALE}
        >
          {buttonLabel}
        </Text>
        <AppIcon
          name="arrowRight"
          size={ICON_SIZES.md}
          color={BUTTON_ICON_COLOR[variant]}
          weight="bold"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
