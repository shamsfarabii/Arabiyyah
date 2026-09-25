import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { getGreeting } from '@/components/home/getGreeting';
import { HOME_MAX_FONT_SCALE } from '@/components/home/homeLayout';
import { IconButton } from '@/components/ui/IconButton';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING } from '@/constants/theme';
import { commonStyles } from '@/styles/commonStyles';

type HomeHeaderProps = {
  isCompact: boolean;
};

export function HomeHeader({ isCompact }: HomeHeaderProps) {
  return (
    <View style={[commonStyles.row, commonStyles.alignCenter, styles.header]}>
      <View style={styles.headerText}>
        <Text style={styles.greeting} maxFontSizeMultiplier={HOME_MAX_FONT_SCALE}>
          {getGreeting()}
        </Text>
        <Text
          style={[styles.title, isCompact && styles.titleCompact]}
          maxFontSizeMultiplier={HOME_MAX_FONT_SCALE}
          numberOfLines={1}
        >
          My Arabic
        </Text>
        <Text style={styles.subtitle} maxFontSizeMultiplier={HOME_MAX_FONT_SCALE}>
          Keep learning, one word at a time.
        </Text>
      </View>

      <IconButton
        icon="settings"
        accessibilityLabel="Open settings"
        onPress={() => router.push('/settings')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 2,
    fontSize: FONT_SIZES.hero + 2,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.textDark,
    letterSpacing: -0.8,
  },
  titleCompact: {
    fontSize: FONT_SIZES.display,
  },
  subtitle: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
});
