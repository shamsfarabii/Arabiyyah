import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  ICON_SIZES,
  SIZES,
  SPACING,
} from '@/constants/theme';
import { commonStyles } from '@/styles/commonStyles';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: ReactNode;
};

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  rightAction,
}: ScreenHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={[commonStyles.row, commonStyles.alignCenter, styles.header]}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.iconButton,
              commonStyles.centered,
              pressed && styles.iconButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <AppIcon
              name="chevronLeft"
              size={ICON_SIZES.lg}
              color={COLORS.primary}
              weight="bold"
            />
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.rightSlot}>
          {rightAction ?? <View style={styles.iconPlaceholder} />}
        </View>
      </View>

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.lg,
  },
  header: {
    marginBottom: 0,
  },
  iconButton: {
    width: SIZES.headerIconButton,
    height: SIZES.headerIconButton,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconButtonPressed: {
    backgroundColor: COLORS.surfacePressed,
  },
  iconPlaceholder: {
    width: SIZES.headerIconButton,
    height: SIZES.headerIconButton,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  subtitle: {
    marginTop: SPACING.sm,
    textAlign: 'center',
    fontSize: FONT_SIZES.md,
    lineHeight: 20,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.md,
  },
  rightSlot: {
    minWidth: SIZES.headerIconButton,
    alignItems: 'flex-end',
  },
});
