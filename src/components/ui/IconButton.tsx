import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import {
  BORDER_RADIUS,
  COLORS,
  ICON_SIZES,
  SIZES,
} from '@/constants/theme';
import { commonStyles } from '@/styles/commonStyles';

type IconButtonTone = 'neutral' | 'danger' | 'overlay';

type IconButtonProps = {
  icon: AppIconName;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  tone?: IconButtonTone;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const TONE_ICON_COLOR: Record<IconButtonTone, string> = {
  neutral: COLORS.textMuted,
  danger: COLORS.danger,
  overlay: COLORS.textOnPrimary,
};

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  tone = 'neutral',
  disabled = false,
  style,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      hitSlop={10}
      style={({ pressed }) => [
        styles.base,
        commonStyles.centered,
        tone === 'neutral' && styles.neutral,
        tone === 'danger' && styles.danger,
        tone === 'overlay' && styles.overlay,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <AppIcon
        name={icon}
        size={ICON_SIZES.sm}
        color={TONE_ICON_COLOR[tone]}
        weight="semibold"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: SIZES.iconButton,
    height: SIZES.iconButton,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
  },
  neutral: {
    backgroundColor: COLORS.surfaceMuted,
    borderColor: COLORS.border,
  },
  danger: {
    backgroundColor: COLORS.surfaceDanger,
    borderColor: COLORS.borderDanger,
  },
  overlay: {
    backgroundColor: COLORS.imageScrim,
    borderColor: COLORS.decorationOverlay,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
});
