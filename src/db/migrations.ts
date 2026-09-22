import type { SQLiteDatabase } from 'expo-sqlite';

import { createId } from '@/utils/createId';

const DATABASE_VERSION = 4;

export const MIGRATION_V1 = `
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

export const MIGRATION_V2 = `
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

export const MIGRATION_V3 = `
CREATE TABLE IF NOT EXISTS app_user (
  id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vocabulary_stats (
  user_id TEXT NOT NULL,
  vocabulary_id TEXT NOT NULL,
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  last_attempted_at TEXT,
  PRIMARY KEY (user_id, vocabulary_id),
  FOREIGN KEY (user_id)
    REFERENCES app_user(id)
    ON DELETE CASCADE,
  FOREIGN KEY (vocabulary_id)
    REFERENCES vocabulary(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_attempt (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  wrong_answers INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id)
    REFERENCES app_user(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempt_user_started
  ON quiz_attempt(user_id, started_at);

CREATE TABLE IF NOT EXISTS quiz_question (
  id TEXT PRIMARY KEY NOT NULL,
  quiz_attempt_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  vocabulary_id TEXT,
  correct_option_id TEXT NOT NULL,
  prompt_word TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  options_json TEXT NOT NULL,
  selected_option_id TEXT,
  selected_answer TEXT,
  was_correct INTEGER,
  timed_out INTEGER,
  answered_at TEXT,
  UNIQUE (quiz_attempt_id, position),
  FOREIGN KEY (quiz_attempt_id)
    REFERENCES quiz_attempt(id)
    ON DELETE CASCADE,
  FOREIGN KEY (vocabulary_id)
    REFERENCES vocabulary(id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_quiz_question_attempt_position
  ON quiz_question(quiz_attempt_id, position);
`;

/**
 * Columns every quiz table must have for the current code to work.
 *
 * An earlier, abandoned version of this feature shipped to devices with a
 * different quiz schema and stamped the same `user_version`, so the v3 block
 * above is skipped there and the tables never get corrected. V4 detects that
 * and rebuilds them.
 */
const QUIZ_TABLE_COLUMNS: Record<string, string[]> = {
  app_user: ['id', 'display_name', 'created_at'],
  vocabulary_stats: [
    'user_id',
    'vocabulary_id',
    'correct_count',
    'wrong_count',
    'total_attempts',
    'last_attempted_at',
  ],
  quiz_attempt: [
    'id',
    'user_id',
    'started_at',
    'completed_at',
    'total_questions',
    'correct_answers',
    'wrong_answers',
  ],
  quiz_question: [
    'id',
    'quiz_attempt_id',
    'position',
    'vocabulary_id',
    'correct_option_id',
    'prompt_word',
    'correct_answer',
    'options_json',
    'selected_option_id',
    'selected_answer',
    'was_correct',
    'timed_out',
    'answered_at',
  ],
};

/** Children before parents, so the drops stay valid whatever the old shape was. */
const QUIZ_TABLE_DROP_ORDER = [
  'quiz_question',
  'quiz_attempt',
  'vocabulary_stats',
  'app_user',
] as const;

async function hasOutdatedQuizSchema(db: SQLiteDatabase): Promise<boolean> {
  for (const [table, requiredColumns] of Object.entries(QUIZ_TABLE_COLUMNS)) {
    const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table});`);

    // An absent table is not outdated; the v3 statements create it.
    if (columns.length === 0) {
      continue;
    }

    const existingColumns = new Set(columns.map((column) => column.name));
    if (requiredColumns.some((column) => !existingColumns.has(column))) {
      return true;
    }
  }

  return false;
}

/**
 * Drops all four quiz tables together rather than patching columns one by one.
 * They reference each other, and rows written under an unknown older shape
 * cannot be mapped onto the current one anyway. Vocabulary is never touched.
 */
async function rebuildQuizSchema(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = OFF;');

  try {
    for (const table of QUIZ_TABLE_DROP_ORDER) {
      await db.execAsync(`DROP TABLE IF EXISTS ${table};`);
    }
  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON;');
  }
}


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

    await db.execAsync('PRAGMA user_version = 2;');
  }

  const versionAfterV2 = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;',
  );

  if ((versionAfterV2?.user_version ?? 0) < 3) {
    await db.execAsync(MIGRATION_V3);
    await db.execAsync('PRAGMA user_version = 3;');
  }

  const versionAfterV3 = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;',
  );

  if ((versionAfterV3?.user_version ?? 0) < 4) {
    if (await hasOutdatedQuizSchema(db)) {
      await rebuildQuizSchema(db);
    }

    // Recreates anything that was dropped, and is a no-op otherwise.
    await db.execAsync(MIGRATION_V3);
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
  }
}
