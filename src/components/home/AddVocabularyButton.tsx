import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
import { commonStyles } from '@/styles/commonStyles';

export function AddVocabularyButton() {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/vocabulary/new')}
      style={({ pressed }) => [
        styles.addButton,
        commonStyles.row,
        commonStyles.centered,
        pressed && styles.addButtonPressed,
      ]}
    >
      <View style={[commonStyles.centered, styles.addButtonIconWrap]}>
        <AppIcon name="plus" size={ICON_SIZES.md} color={COLORS.textOnPrimary} weight="bold" />
      </View>
      <Text style={styles.addButtonText} numberOfLines={1} maxFontSizeMultiplier={HOME_MAX_FONT_SCALE}>
        Add Vocabulary
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  addButton: {
    minHeight: SIZES.addButtonHeight,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.addButtonBorder,
    backgroundColor: COLORS.surfaceAddButton,
    gap: SPACING.sm + 2,
  },
  addButtonPressed: {
    backgroundColor: COLORS.surfaceAddButtonPressed,
  },
  addButtonIconWrap: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary,
  },
  addButtonText: {
    flexShrink: 1,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
});
