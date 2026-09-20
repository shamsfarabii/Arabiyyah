import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { COLORS, FONT_SIZES } from '@/constants/theme';
import { VocabularyForm } from '@/features/vocabulary/components/VocabularyForm';
import {
  getVocabulary,
  removeVocabulary,
  saveVocabulary,
} from '@/features/vocabulary/services/vocabularyService';
import type { Vocabulary } from '@/features/vocabulary/types';
import { commonStyles } from '@/styles/commonStyles';

export default function EditVocabularyRoute() {
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

  useEffect(() => {
    void loadVocabulary();
  }, [loadVocabulary]);

  const handleDelete = () => {
    Alert.alert(
      'Delete vocabulary',
      'This card and its review history will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await removeVocabulary(vocabularyId);
                router.replace('/vocabulary');
              } catch (error: unknown) {
                const message =
                  error instanceof Error ? error.message : 'Could not delete vocabulary.';
                Alert.alert('Delete failed', message);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <ScreenScaffold>
      <ScreenHeader title="Edit Vocabulary" onBack={() => router.back()} />

      {isLoading ? (
        <View style={[commonStyles.centered, { minHeight: 200 }]}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : null}

      {!isLoading && loadError ? (
        <Text style={{ fontSize: FONT_SIZES.md, color: COLORS.textMuted }}>{loadError}</Text>
      ) : null}

      {!isLoading && vocabulary ? (
        <VocabularyForm
          submitLabel="Save"
          initialValues={{
            arabicWord: vocabulary.arabicWord,
            meaning: vocabulary.meaning,
            examples: vocabulary.examples.map((example) => ({
              sentence: example.sentence,
              meaning: example.meaning ?? '',
            })),
            description: vocabulary.description ?? '',
            imageUri: vocabulary.imageUri ?? '',
          }}
          onSubmit={async (values) => {
            await saveVocabulary(vocabulary.id, values);
            router.back();
          }}
          onDelete={handleDelete}
        />
      ) : null}
    </ScreenScaffold>
  );
}
