import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { COLORS, FONT_SIZES, FONT_WEIGHTS } from '@/constants/theme';
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
        <ScreenHeader title="Vocabulary" onBack={() => router.back()} />
        <View style={[commonStyles.grow, commonStyles.centered]}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      </ScreenScaffold>
    );
  }

  if (loadError || !vocabulary) {
    return (
      <ScreenScaffold>
        <ScreenHeader title="Vocabulary" onBack={() => router.back()} />
        <Text style={{ fontSize: FONT_SIZES.md, color: COLORS.textMuted }}>
          {loadError ?? 'Vocabulary not found.'}
        </Text>
        <Pressable onPress={() => void loadVocabulary()}>
          <Text
            style={{
              marginTop: 16,
              fontSize: FONT_SIZES.md,
              fontWeight: FONT_WEIGHTS.semibold,
              color: COLORS.primary,
            }}
          >
            Try again
          </Text>
        </Pressable>
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
