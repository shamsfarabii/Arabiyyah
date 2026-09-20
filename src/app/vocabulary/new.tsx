import { router } from 'expo-router';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { VocabularyForm } from '@/features/vocabulary/components/VocabularyForm';
import { createVocabulary } from '@/features/vocabulary/services/vocabularyService';

export default function NewVocabularyRoute() {
  return (
    <ScreenScaffold>
      <ScreenHeader
        title="Add Vocabulary"
        subtitle="Capture the word, its meaning, and anything that helps you remember it."
        onBack={() => router.back()}
      />
      <VocabularyForm
        submitLabel="Save"
        onSubmit={async (values) => {
          await createVocabulary(values);
          router.replace('/vocabulary');
        }}
      />
    </ScreenScaffold>
  );
}
