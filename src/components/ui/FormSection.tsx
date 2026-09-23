import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
} from '@/constants/theme';
import { commonStyles } from '@/styles/commonStyles';

type FormSectionProps = {
  title: string;
  /** Small pill on the right of the title, e.g. "Required" or "1 of 3". */
  badge?: string;
  badgeTone?: 'neutral' | 'required';
  hint?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function FormSection({
  title,
  badge,
  badgeTone = 'neutral',
  hint,
  children,
  style,
}: FormSectionProps) {
  return (
    <View style={[styles.section, style]}>
      <View style={[commonStyles.row, commonStyles.alignCenter, styles.titleRow]}>
        <Text style={styles.title}>{title}</Text>
        {badge ? (
          <View style={[styles.badge, badgeTone === 'required' && styles.badgeRequired]}>
            <Text
              style={[
                styles.badgeLabel,
                badgeTone === 'required' && styles.badgeLabelRequired,
              ]}
            >
              {badge}
            </Text>
          </View>
        ) : null}
      </View>

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: SPACING.sm + 2,
  },
  titleRow: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surfaceMuted,
  },
  badgeRequired: {
    backgroundColor: COLORS.surfaceDanger,
  },
  badgeLabel: {
    fontSize: FONT_SIZES.xs - 1,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textMuted,
    letterSpacing: 0.3,
  },
  badgeLabelRequired: {
    color: COLORS.danger,
  },
  hint: {
    marginTop: -SPACING.xs,
    paddingHorizontal: SPACING.xs,
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
    color: COLORS.textMutedSecondary,
  },
});
