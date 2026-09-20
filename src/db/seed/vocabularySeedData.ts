import type { VocabularyInput } from '@/features/vocabulary/types';

export type VocabularySeedEntry = {
  id: string;
  input: VocabularyInput;
};

/** Built-in starter vocabulary (lesson items 3–10). IDs are stable for idempotent seeding. */
export const VOCABULARY_SEED_ENTRIES: VocabularySeedEntry[] = [
  {
    id: 'seed-vocabulary-003',
    input: {
      arabicWord: 'مَاءٌ',
      meaning: 'Water',
      examples: [
        {
          sentence: 'أَشْرَبُ الْمَاءَ.',
          meaning: 'I drink water.',
        },
      ],
    },
  },
  {
    id: 'seed-vocabulary-004',
    input: {
      arabicWord: 'طَعَامٌ',
      meaning: 'Food',
      examples: [
        {
          sentence: 'الطَّعَامُ لَذِيذٌ.',
          meaning: 'The food is delicious.',
        },
      ],
    },
  },
  {
    id: 'seed-vocabulary-005',
    input: {
      arabicWord: 'مَدْرَسَةٌ',
      meaning: 'School',
      examples: [
        {
          sentence: 'أَنَا أَذْهَبُ إِلَى الْمَدْرَسَةِ.',
          meaning: 'I go to school.',
        },
      ],
    },
  },
  {
    id: 'seed-vocabulary-006',
    input: {
      arabicWord: 'صَدِيقٌ',
      meaning: 'Friend',
      examples: [
        {
          sentence: 'هُوَ صَدِيقِي.',
          meaning: 'He is my friend.',
        },
      ],
    },
  },
  {
    id: 'seed-vocabulary-007',
    input: {
      arabicWord: 'سَيَّارَةٌ',
      meaning: 'Car',
      examples: [
        {
          sentence: 'هَذِهِ سَيَّارَةٌ جَدِيدَةٌ.',
          meaning: 'This is a new car.',
        },
      ],
    },
  },
  {
    id: 'seed-vocabulary-008',
    input: {
      arabicWord: 'بَابٌ',
      meaning: 'Door',
      examples: [
        {
          sentence: 'الْبَابُ مَفْتُوحٌ.',
          meaning: 'The door is open.',
        },
      ],
    },
  },
  {
    id: 'seed-vocabulary-009',
    input: {
      arabicWord: 'شَمْسٌ',
      meaning: 'Sun',
      examples: [
        {
          sentence: 'الشَّمْسُ سَاطِعَةٌ.',
          meaning: 'The sun is shining.',
        },
      ],
    },
  },
  {
    id: 'seed-vocabulary-010',
    input: {
      arabicWord: 'قَلَمٌ',
      meaning: 'Pen',
      examples: [
        {
          sentence: 'عِنْدِي قَلَمٌ.',
          meaning: 'I have a pen.',
        },
      ],
    },
  },
];
