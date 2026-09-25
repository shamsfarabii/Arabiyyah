import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { HomeStat } from '@/components/home/buildHomeView';
import { HOME_MAX_FONT_SCALE } from '@/components/home/homeLayout';
import { AppIcon } from '@/components/ui/AppIcon';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  ICON_SIZES,
  SPACING,
} from '@/constants/theme';
import { createShadow } from '@/helpers/styleHelpers';
import { commonStyles } from '@/styles/commonStyles';

type VocabularyHeroCardProps = {
  isCompact: boolean;
  totalWordsText: string;
  collectedLabel: string;
  accessibilityLabel: string;
  stats: HomeStat[];
};

const heroShadow = createShadow(6, COLORS.accent, 0.22, 18, { width: 0, height: 10 });

export function VocabularyHeroCard({
  isCompact,
  totalWordsText,
  collectedLabel,
  accessibilityLabel,
  stats,
}: VocabularyHeroCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => router.push('/vocabulary')}
      style={({ pressed }) => [
        styles.heroCard,
        isCompact && styles.heroCardCompact,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.heroDecoration} maxFontSizeMultiplier={1} aria-hidden>
        كلمات
      </Text>

      <View style={[commonStyles.row, commonStyles.alignCenter, commonStyles.spaceBetween]}>
        <View style={[commonStyles.row, commonStyles.alignCenter, styles.heroLabelRow]}>
          <View style={[commonStyles.centered, styles.heroIconChip]}>
            <AppIcon name="book" size={ICON_SIZES.sm} color={COLORS.textOnPrimary} />
          </View>
          <Text style={styles.heroLabel} maxFontSizeMultiplier={HOME_MAX_FONT_SCALE}>
            Vocabulary
          </Text>
        </View>

        <View style={[commonStyles.row, commonStyles.alignCenter, styles.heroLink]}>
          <Text style={styles.heroLinkText} maxFontSizeMultiplier={HOME_MAX_FONT_SCALE}>
            Open
          </Text>
          <AppIcon
            name="chevronRight"
            size={ICON_SIZES.sm - 4}
            color={COLORS.textOnDarkCard}
            weight="bold"
          />
        </View>
      </View>

      <View style={[commonStyles.row, styles.heroValueRow]}>
        <Text
          style={[styles.heroValue, isCompact && styles.heroValueCompact]}
          maxFontSizeMultiplier={1.2}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {totalWordsText}
        </Text>
        <Text style={styles.heroValueUnit} maxFontSizeMultiplier={HOME_MAX_FONT_SCALE}>
          {collectedLabel}
        </Text>
      </View>

      <View style={[commonStyles.row, styles.heroStats]}>
        {stats.map((stat, index) => (
          <View key={stat.label} style={[styles.heroStat, index > 0 && styles.heroStatDivider]}>
            <Text
              style={styles.heroStatValue}
              maxFontSizeMultiplier={1.2}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {stat.value}
            </Text>
            <Text
              style={styles.heroStatLabel}
              maxFontSizeMultiplier={1.2}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.hero,
    backgroundColor: COLORS.primaryDark,
    overflow: 'hidden',
    marginBottom: SPACING.xxl,
    ...heroShadow,
  },
  heroCardCompact: {
    padding: SPACING.md,
  },
  heroDecoration: {
    position: 'absolute',
    right: -SPACING.sm,
    top: SPACING.xl,
    fontSize: FONT_SIZES.decoration + 16,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.decorationOverlay,
  },
  heroLabelRow: {
    gap: SPACING.sm,
    flexShrink: 1,
  },
  heroIconChip: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.heroIconChip,
  },
  heroLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textOnDarkCard,
  },
  heroLink: {
    gap: 2,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.heroLinkSurface,
  },
  heroLinkText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textOnDarkCard,
  },
  heroValueRow: {
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: SPACING.sm,
    marginTop: SPACING.md,
  },
  heroValue: {
    fontSize: FONT_SIZES.stat + 6,
    lineHeight: FONT_SIZES.stat + 14,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.textOnPrimary,
    letterSpacing: -1,
  },
  heroValueCompact: {
    fontSize: FONT_SIZES.stat - 4,
    lineHeight: FONT_SIZES.stat + 4,
  },
  heroValueUnit: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textOnDarkCardMuted,
  },
  heroStats: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.heroDivider,
  },
  heroStat: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: SPACING.sm,
  },
  heroStatDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: COLORS.heroDivider,
  },
  heroStatValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textOnPrimary,
  },
  heroStatLabel: {
    marginTop: 2,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textOnDarkCardMuted,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
});
