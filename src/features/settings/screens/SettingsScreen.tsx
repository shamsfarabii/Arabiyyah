import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { FormSection } from '@/components/ui/FormSection';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  ICON_SIZES,
  SPACING,
} from '@/constants/theme';
import { resetUserProgress } from '@/features/settings/services/settingsService';
import { createShadow } from '@/helpers/styleHelpers';
import { appAlert } from '@/utils/appAlert';
import { commonStyles } from '@/styles/commonStyles';

const cardShadow = createShadow(2, COLORS.accent, 0.06, 10, { width: 0, height: 4 });

export function SettingsScreen() {
  const [isResetting, setIsResetting] = useState(false);

  const runReset = useCallback(async () => {
    setIsResetting(true);

    try {
      await resetUserProgress();
      appAlert(
        'Progress reset',
        'Quiz scores, review history, and practice stats were cleared. Your vocabulary is unchanged.',
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Could not reset your progress.';
      appAlert('Reset failed', message);
    } finally {
      setIsResetting(false);
    }
  }, []);

  const confirmResetProgress = useCallback(() => {
    appAlert(
      'Reset all progress?',
      'This removes quiz history, daily review sessions, and per-word practice stats. Your vocabulary words stay in your collection.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset progress',
          style: 'destructive',
          onPress: () => {
            void runReset();
          },
        },
      ],
    );
  }, [runReset]);

  return (
    <ScreenScaffold>
      <ScreenHeader title="Settings" onBack={() => router.back()} />

      <FormSection
        title="Learning data"
        hint="Use this if you want a fresh start without deleting your words."
      >
        <View style={styles.card}>
          <View style={[commonStyles.row, styles.cardHeader]}>
            <View style={[commonStyles.centered, styles.iconChip]}>
              <AppIcon name="refresh" size={ICON_SIZES.md} color={COLORS.danger} />
            </View>
            <View style={commonStyles.grow}>
              <Text style={styles.cardTitle}>Reset all progress</Text>
              <Text style={styles.cardBody}>
                Clears quiz attempts, review sessions, accuracy stats, and quiz readiness.
                Vocabulary cards are not deleted.
              </Text>
            </View>
          </View>

          <PrimaryButton
            label="Reset progress"
            variant="danger"
            loading={isResetting}
            disabled={isResetting}
            onPress={confirmResetProgress}
            accessibilityHint="Opens a confirmation before clearing learning history"
          />
        </View>
      </FormSection>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.card,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...cardShadow,
  },
  cardHeader: {
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceDanger,
    borderWidth: 1,
    borderColor: COLORS.borderDanger,
  },
  cardTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  cardBody: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.md,
    lineHeight: 20,
    color: COLORS.textMuted,
  },
});
