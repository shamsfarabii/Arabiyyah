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
import {
  GITHUB_RELEASES_PAGE_URL,
  LATEST_APK_DOWNLOAD_URL,
} from '@/constants/appLinks';
import { resetUserProgress } from '@/features/settings/services/settingsService';
import { openExternalUrl } from '@/utils/openExternalUrl';
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

  const openLatestApkDownload = useCallback(async () => {
    try {
      await openExternalUrl(LATEST_APK_DOWNLOAD_URL);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Could not open the download link.';
      appAlert('Download unavailable', message);
    }
  }, []);

  const openReleasesPage = useCallback(async () => {
    try {
      await openExternalUrl(GITHUB_RELEASES_PAGE_URL);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Could not open GitHub.';
      appAlert('Link unavailable', message);
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
        title="Android app"
        hint="Install or update Lugati outside the Play Store."
      >
        <View style={styles.card}>
          <View style={[commonStyles.row, styles.cardHeader]}>
            <View style={[commonStyles.centered, styles.iconChipDownload]}>
              <AppIcon name="importDoc" size={ICON_SIZES.md} color={COLORS.primary} />
            </View>
            <View style={commonStyles.grow}>
              <Text style={styles.cardTitle}>Latest APK on GitHub</Text>
              <Text style={styles.cardBody}>
                Download the newest Android build from our public GitHub releases. You may need
                to allow installs from your browser or file manager.
              </Text>
              <Text
                style={styles.linkText}
                accessibilityRole="link"
                onPress={() => {
                  void openLatestApkDownload();
                }}
              >
                {LATEST_APK_DOWNLOAD_URL}
              </Text>
            </View>
          </View>

          <PrimaryButton
            label="Download latest APK"
            variant="secondary"
            leading={<AppIcon name="importDoc" size={ICON_SIZES.sm} color={COLORS.primary} />}
            onPress={() => {
              void openLatestApkDownload();
            }}
            accessibilityHint="Opens the latest Android APK download on GitHub"
          />

          <PrimaryButton
            label="All releases on GitHub"
            variant="secondary"
            leading={<AppIcon name="share" size={ICON_SIZES.sm} color={COLORS.primary} />}
            onPress={() => {
              void openReleasesPage();
            }}
            accessibilityHint="Opens the GitHub releases page in your browser"
          />
        </View>
      </FormSection>

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
  iconChipDownload: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  linkText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
    color: COLORS.primary,
    textDecorationLine: 'underline',
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
