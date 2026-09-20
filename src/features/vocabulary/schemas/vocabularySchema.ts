import { z } from 'zod';

const optionalTextField = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

export const vocabularySchema = z.object({
  arabicWord: z.string().trim().min(1, 'Arabic word is required'),
  meaning: z.string().trim().min(1, 'Meaning is required'),
  exampleSentence: optionalTextField,
  description: optionalTextField,
  imageUri: optionalTextField,
});

export type VocabularyFormValues = z.input<typeof vocabularySchema>;
export type VocabularyValidatedInput = z.infer<typeof vocabularySchema>;
