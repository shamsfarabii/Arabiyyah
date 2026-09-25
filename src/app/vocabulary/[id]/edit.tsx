import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING } from '@/constants/theme';
import { VocabularyForm } from '@/features/vocabulary/components/VocabularyForm';
import {
  getVocabulary,
  removeVocabulary,
  saveVocabulary,
} from '@/features/vocabulary/services/vocabularyService';
import type { Vocabulary } from '@/features/vocabulary/types';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { appAlert } from '@/utils/appAlert';
import { commonStyles } from '@/styles/commonStyles';

export default function EditVocabularyRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vocabularyId = typeof id === 'string' ? id : '';

  const [vocabulary, setVocabulary] = useState<Vocabulary | null>(null);
  const [isLoading, setIsLoading] = useState(vocabularyId.length > 0);
  const [loadError, setLoadError] = useState<string | null>(
    vocabularyId.length > 0 ? null : 'Missing vocabulary id.',
  );
  const [attempt, setAttempt] = useState(0);
  const [requestedLoad, setRequestedLoad] = useState({ vocabularyId, attempt: 0 });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  if (
    requestedLoad.vocabularyId !== vocabularyId ||
    requestedLoad.attempt !== attempt
  ) {
    setRequestedLoad({ vocabularyId, attempt });
    setVocabulary(null);
    setIsLoading(vocabularyId.length > 0);
    setLoadError(vocabularyId.length > 0 ? null : 'Missing vocabulary id.');
  }

  const allowLeave = useUnsavedChangesGuard(hasUnsavedChanges, {
    title: 'Discard changes?',
    message: 'Your edits to this word will be lost.',
  });

  useEffect(() => {
    if (!vocabularyId) {
      return;
    }

    let isCurrent = true;

    void getVocabulary(vocabularyId).then(
      (item) => {
        if (!isCurrent) {
          return;
        }
        if (!item) {
          setVocabulary(null);
          setLoadError('Vocabulary not found.');
          setIsLoading(false);
          return;
        }
        setVocabulary(item);
        setLoadError(null);
        setIsLoading(false);
      },
      (error: unknown) => {
        if (!isCurrent) {
          return;
        }
        const message =
          error instanceof Error ? error.message : 'Could not load vocabulary.';
        setVocabulary(null);
        setLoadError(message);
        setIsLoading(false);
      },
    );

    return () => {
      isCurrent = false;
    };
  }, [vocabularyId, attempt]);

  const handleDelete = () => {
    appAlert(
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
                allowLeave();
                router.replace('/vocabulary');
              } catch (error: unknown) {
                const message =
                  error instanceof Error ? error.message : 'Could not delete vocabulary.';
                appAlert('Delete failed', message);
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
        <View style={[commonStyles.centered, styles.state]}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : null}

      {!isLoading && loadError ? (
        <View style={[commonStyles.centered, styles.state]}>
          <Text style={styles.errorTitle}>Could not open this word</Text>
          <Text style={styles.errorBody}>{loadError}</Text>
          <PrimaryButton
            label="Try again"
            variant="secondary"
            onPress={() => setAttempt((currentAttempt) => currentAttempt + 1)}
            style={styles.retryButton}
          />
        </View>
      ) : null}

      {!isLoading && vocabulary ? (
        <VocabularyForm
          submitLabel="Save changes"
          onDirtyChange={setHasUnsavedChanges}
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
            allowLeave();
            router.back();
          }}
          onDelete={handleDelete}
        />
      ) : null}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  state: {
    minHeight: 220,
    paddingHorizontal: SPACING.md,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  errorBody: {
    fontSize: FONT_SIZES.md,
    lineHeight: 20,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.md,
    alignSelf: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
