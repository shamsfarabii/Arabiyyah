import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 1;

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

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;',
  );
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(MIGRATION_V1);
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
  }
}
