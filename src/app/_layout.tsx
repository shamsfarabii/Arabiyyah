import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppAlertProvider } from '@/components/ui/AppAlertProvider';
import { BottomNav } from '@/components/ui/BottomNav';
import { COLORS, FONT_SIZES, SPACING } from '@/constants/theme';
import { initializeDatabase } from '@/db/database';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    initializeDatabase()
      .then(() => setIsReady(true))
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Could not initialize the database.';
        setErrorMessage(message);
      });
  }, []);

  if (errorMessage) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Database error</Text>
        <Text style={styles.errorBody}>{errorMessage}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <AppAlertProvider>
      <View style={styles.app}>
        <View style={styles.app}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
        <BottomNav />
      </View>
    </AppAlertProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  errorBody: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
