import type { SQLiteDatabase } from 'expo-sqlite';

import { createId } from '@/utils/createId';

const DATABASE_VERSION = 2;

const MIGRATION_V1 = `
CREATE TABLE IF NOT EXISTS vocabulary (
  id TEXT PRIMARY KEY NOT NULL,
  arabic_word TEXT NOT NULL,
  meaning TEXT NOT NULL,
  example_sentence TEXT,
  description TEXT,
  image_uri TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vocabulary_review (
  vocabulary_id TEXT PRIMARY KEY NOT NULL,
  review_level INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  next_review_at TEXT NOT NULL,
  FOREIGN KEY (vocabulary_id)
    REFERENCES vocabulary(id)
    ON DELETE CASCADE
);
`;

const MIGRATION_V2 = `
CREATE TABLE IF NOT EXISTS vocabulary_example (
  id TEXT PRIMARY KEY NOT NULL,
  vocabulary_id TEXT NOT NULL,
  sentence TEXT NOT NULL,
  meaning TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (vocabulary_id)
    REFERENCES vocabulary(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vocabulary_example_vocabulary_id
  ON vocabulary_example(vocabulary_id);
`;

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;',
  );
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(MIGRATION_V1);
    await db.execAsync('PRAGMA user_version = 1;');
  }

  const versionAfterV1 = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;',
  );
  const version = versionAfterV1?.user_version ?? 0;

  if (version < 2) {
    await db.execAsync(MIGRATION_V2);

    const legacyRows = await db.getAllAsync<{
      id: string;
      example_sentence: string | null;
    }>(
      `SELECT id, example_sentence
       FROM vocabulary
       WHERE example_sentence IS NOT NULL
         AND trim(example_sentence) != '';`,
    );

    for (const row of legacyRows) {
      await db.runAsync(
        `INSERT INTO vocabulary_example (
          id,
          vocabulary_id,
          sentence,
          meaning,
          sort_order
        ) VALUES (?, ?, ?, NULL, 0);`,
        createId(),
        row.id,
        row.example_sentence,
      );
    }

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
  }
}
