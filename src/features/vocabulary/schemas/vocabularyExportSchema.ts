import { z } from 'zod';

import { MAX_VOCABULARY_EXAMPLES } from '@/features/vocabulary/constants';
import { vocabularySchema } from '@/features/vocabulary/schemas/vocabularySchema';

const exportExampleSchema = z.object({
  sentence: z.string().trim().min(1),
  meaning: z.string().trim().optional(),
});

export const vocabularyExportItemSchema = z.object({
  arabicWord: z.string().trim().min(1),
  meaning: z.string().trim().min(1),
  examples: z
    .array(exportExampleSchema)
    .max(MAX_VOCABULARY_EXAMPLES)
    .default([]),
  description: z.string().trim().optional(),
});

export const vocabularyExportFileSchema = z.object({
  formatVersion: z.literal(1),
  app: z.literal('my-arabic'),
  exportedAt: z.string().datetime(),
  items: z.array(vocabularyExportItemSchema).min(1),
});

export type VocabularyExportItem = z.infer<typeof vocabularyExportItemSchema>;
export type VocabularyExportFile = z.infer<typeof vocabularyExportFileSchema>;

export function toValidatedVocabularyInput(
  item: VocabularyExportItem,
): z.infer<typeof vocabularySchema> {
  return vocabularySchema.parse({
    arabicWord: item.arabicWord,
    meaning: item.meaning,
    examples: item.examples.map((example) => ({
      sentence: example.sentence,
      meaning: example.meaning ?? '',
    })),
    description: item.description ?? '',
    imageUri: '',
  });
}
