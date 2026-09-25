import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
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
import { VocabularyDetailScreen } from '@/features/vocabulary/screens/VocabularyDetailScreen';
import { getVocabulary } from '@/features/vocabulary/services/vocabularyService';
import type { Vocabulary } from '@/features/vocabulary/types';
import { commonStyles } from '@/styles/commonStyles';

export default function VocabularyDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vocabularyId = typeof id === 'string' ? id : '';

  const [vocabulary, setVocabulary] = useState<Vocabulary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadVocabulary = useCallback(async () => {
    if (!vocabularyId) {
      setLoadError('Missing vocabulary id.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const item = await getVocabulary(vocabularyId);
      if (!item) {
        setLoadError('Vocabulary not found.');
        setVocabulary(null);
        return;
      }
      setVocabulary(item);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Could not load vocabulary.';
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, [vocabularyId]);

  useFocusEffect(
    useCallback(() => {
      void loadVocabulary();
    }, [loadVocabulary]),
  );

  if (isLoading) {
    return (
      <ScreenScaffold scroll={false}>
        <ScreenHeader title="Word" onBack={() => router.back()} />
        <View style={[commonStyles.grow, commonStyles.centered]}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      </ScreenScaffold>
    );
  }

  if (loadError || !vocabulary) {
    return (
      <ScreenScaffold scroll={false}>
        <ScreenHeader title="Word" onBack={() => router.back()} />
        <View style={[commonStyles.grow, commonStyles.centered, styles.errorState]}>
          <View style={[styles.errorIcon, commonStyles.centered]}>
            <AppIcon name="warning" size={ICON_SIZES.xxl} color={COLORS.danger} />
          </View>
          <Text style={styles.errorTitle}>Could not open this word</Text>
          <Text style={styles.errorBody}>{loadError ?? 'Vocabulary not found.'}</Text>
          <PrimaryButton
            label="Try again"
            variant="secondary"
            onPress={() => void loadVocabulary()}
            style={styles.errorButton}
          />
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <VocabularyDetailScreen
      vocabulary={vocabulary}
      onBack={() => router.back()}
      onEdit={() => router.push(`/vocabulary/${vocabulary.id}/edit`)}
    />
  );
}

const styles = StyleSheet.create({
  errorState: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.section,
  },
  errorIcon: {
    width: 64,
    height: 64,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.xxl,
    backgroundColor: COLORS.surfaceDanger,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs + 2,
  },
  errorBody: {
    maxWidth: 300,
    fontSize: FONT_SIZES.md,
    lineHeight: 20,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: SPACING.lg,
    alignSelf: 'stretch',
  },
});
