import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { HOME_MAX_FONT_SCALE } from '@/components/home/homeLayout';
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
import type { Vocabulary } from '@/features/vocabulary/types';
import { createShadow } from '@/helpers/styleHelpers';
import { commonStyles } from '@/styles/commonStyles';

type RecentWordsSectionProps = {
  isLoading: boolean;
  isCompact: boolean;
  items: Vocabulary[];
};

const cardShadow = createShadow(2, COLORS.accent, 0.06, 10, { width: 0, height: 4 });

export function RecentWordsSection({ isLoading, isCompact, items }: RecentWordsSectionProps) {
  return (
    <View>
      <View
        style={[
          commonStyles.row,
          commonStyles.spaceBetween,
          commonStyles.alignCenter,
          styles.sectionHeader,
        ]}
      >
        <Text style={styles.sectionTitle} maxFontSizeMultiplier={HOME_MAX_FONT_SCALE}>
          Recently Added
        </Text>

        <Pressable
          accessibilityRole="link"
          hitSlop={12}
          onPress={() => router.push('/vocabulary')}
          style={({ pressed }) => pressed && styles.linkPressed}
        >
          <Text style={styles.linkText} maxFontSizeMultiplier={HOME_MAX_FONT_SCALE}>
            View all
          </Text>
        </Pressable>
      </View>

      <View style={styles.wordsContainer}>
        {isLoading ? (
          <View style={[commonStyles.centered, styles.wordsLoading]}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : null}

        {!isLoading && items.length === 0 ? (
          <View style={[commonStyles.centered, styles.emptyRecent]}>
            <View style={[commonStyles.centered, styles.emptyIcon]}>
              <AppIcon name="book" size={ICON_SIZES.xl} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle} maxFontSizeMultiplier={HOME_MAX_FONT_SCALE}>
              No words yet
            </Text>
            <Text style={styles.emptyBody} maxFontSizeMultiplier={HOME_MAX_FONT_SCALE}>
              Add your first vocabulary card to start building your collection.
            </Text>
          </View>
        ) : null}

        {!isLoading
          ? items.map((item, index) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.meaning}, ${item.arabicWord}`}
                onPress={() => router.push(`/vocabulary/${item.id}`)}
                style={({ pressed }) => [
                  styles.wordRow,
                  commonStyles.row,
                  commonStyles.alignCenter,
                  index !== items.length - 1 && styles.wordRowBorder,
                  pressed && styles.wordRowPressed,
                ]}
              >
                <Text
                  style={styles.meaning}
                  numberOfLines={1}
                  maxFontSizeMultiplier={HOME_MAX_FONT_SCALE}
                >
                  {item.meaning}
                </Text>
                <Text
                  style={[styles.arabicWord, isCompact && styles.arabicWordCompact]}
                  numberOfLines={1}
                  maxFontSizeMultiplier={HOME_MAX_FONT_SCALE}
                >
                  {item.arabicWord}
                </Text>
                <AppIcon
                  name="chevronRight"
                  size={ICON_SIZES.sm - 2}
                  color={COLORS.chevron}
                  weight="bold"
                />
              </Pressable>
            ))
          : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    gap: SPACING.md,
    marginBottom: SPACING.sm + SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    flexShrink: 1,
  },
  linkText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  linkPressed: {
    opacity: 0.6,
  },
  wordsContainer: {
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
    ...cardShadow,
  },
  wordsLoading: {
    minHeight: SIZES.wordRowMinHeight,
  },
  wordRow: {
    minHeight: SIZES.wordRowMinHeight - 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.md,
  },
  wordRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  wordRowPressed: {
    backgroundColor: COLORS.surfacePressed,
  },
  meaning: {
    flex: 1,
    minWidth: 0,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textMutedSecondary,
    textAlign: 'left',
  },
  arabicWord: {
    flexShrink: 1,
    maxWidth: '55%',
    fontSize: FONT_SIZES.display - 2,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.arabicWord,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  arabicWordCompact: {
    fontSize: FONT_SIZES.xxxl,
  },
  emptyRecent: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  emptyIcon: {
    width: SIZES.practiceIcon,
    height: SIZES.practiceIcon,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surfaceMuted,
    marginBottom: SPACING.sm + SPACING.xs,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  emptyBody: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
});
