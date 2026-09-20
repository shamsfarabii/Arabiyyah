import { z } from 'zod';

const optionalTextField = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

const vocabularyExampleFormSchema = z.object({
  sentence: z.string(),
  meaning: z.string(),
});

const vocabularyExampleSchema = z.object({
  sentence: z.string().trim().min(1, 'Sentence is required'),
  meaning: optionalTextField,
});

export const vocabularySchema = z.object({
  arabicWord: z.string().trim().min(1, 'Arabic word is required'),
  meaning: z.string().trim().min(1, 'Meaning is required'),
  examples: z
    .array(vocabularyExampleFormSchema)
    .transform((entries) =>
      entries
        .map((entry) => ({
          sentence: entry.sentence.trim(),
          meaning: entry.meaning.trim(),
        }))
        .filter((entry) => entry.sentence.length > 0)
        .map((entry) => vocabularyExampleSchema.parse(entry)),
    ),
  description: optionalTextField,
  imageUri: optionalTextField,
});

export type VocabularyFormValues = z.input<typeof vocabularySchema>;
export type VocabularyValidatedInput = z.output<typeof vocabularySchema>;
