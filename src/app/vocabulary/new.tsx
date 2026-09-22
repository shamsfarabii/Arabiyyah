import { router } from 'expo-router';
import { useState } from 'react';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { VocabularyForm } from '@/features/vocabulary/components/VocabularyForm';
import { createVocabulary } from '@/features/vocabulary/services/vocabularyService';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

export default function NewVocabularyRoute() {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const allowLeave = useUnsavedChangesGuard(hasUnsavedChanges, {
    title: 'Discard this word?',
    message: 'What you have typed so far will not be saved.',
  });

  return (
    <ScreenScaffold>
      <ScreenHeader
        title="Add Vocabulary"
        subtitle="Only the word and its meaning are required — everything else helps it stick."
        onBack={() => router.back()}
      />
      <VocabularyForm
        submitLabel="Save word"
        onDirtyChange={setHasUnsavedChanges}
        onSubmit={async (values) => {
          await createVocabulary(values);
          allowLeave();
          router.replace('/vocabulary');
        }}
      />
    </ScreenScaffold>
  );
}
