import type { SQLiteDatabase } from 'expo-sqlite';

import { VOCABULARY_SEED_ENTRIES } from '@/db/seed/vocabularySeedData';
import { createId } from '@/utils/createId';
import { toIsoNow } from '@/utils/dates';

export async function seedVocabulary(db: SQLiteDatabase): Promise<void> {
  const nowIso = toIsoNow();

  for (const entry of VOCABULARY_SEED_ENTRIES) {
    const existing = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM vocabulary WHERE id = ? LIMIT 1;',
      entry.id,
    );

    if (existing) {
      continue;
    }

    await db.runAsync(
      `INSERT INTO vocabulary (
        id,
        arabic_word,
        meaning,
        example_sentence,
        description,
        image_uri,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      entry.id,
      entry.input.arabicWord,
      entry.input.meaning,
      null,
      entry.input.description ?? null,
      entry.input.imageUri ?? null,
      nowIso,
      nowIso,
    );

    for (let index = 0; index < entry.input.examples.length; index += 1) {
      const example = entry.input.examples[index];
      await db.runAsync(
        `INSERT INTO vocabulary_example (
          id,
          vocabulary_id,
          sentence,
          meaning,
          sort_order
        ) VALUES (?, ?, ?, ?, ?);`,
        createId(),
        entry.id,
        example.sentence,
        example.meaning ?? null,
        index,
      );
    }

    await db.runAsync(
      `INSERT INTO vocabulary_review (
        vocabulary_id,
        review_level,
        correct_count,
        incorrect_count,
        next_review_at
      ) VALUES (?, 0, 0, 0, ?);`,
      entry.id,
      nowIso,
    );
  }
}
