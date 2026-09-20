import { getDatabase } from '@/db/database';
import type { Vocabulary, VocabularyInput } from '@/features/vocabulary/types';

type VocabularyRow = {
  id: string;
  arabic_word: string;
  meaning: string;
  example_sentence: string | null;
  description: string | null;
  image_uri: string | null;
  created_at: string;
  updated_at: string;
};

function mapVocabularyRow(row: VocabularyRow): Vocabulary {
  return {
    id: row.id,
    arabicWord: row.arabic_word,
    meaning: row.meaning,
    exampleSentence: row.example_sentence ?? undefined,
    description: row.description ?? undefined,
    imageUri: row.image_uri ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function countVocabulary(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM vocabulary;',
  );
  return row?.count ?? 0;
}

export async function findRecentVocabulary(limit: number): Promise<Vocabulary[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<VocabularyRow>(
    `SELECT *
     FROM vocabulary
     ORDER BY datetime(created_at) DESC
     LIMIT ?;`,
    limit,
  );
  return rows.map(mapVocabularyRow);
}

export async function searchVocabulary(query: string): Promise<Vocabulary[]> {
  const db = await getDatabase();
  const trimmed = query.trim();

  if (trimmed.length === 0) {
    const rows = await db.getAllAsync<VocabularyRow>(
      `SELECT *
       FROM vocabulary
       ORDER BY datetime(updated_at) DESC;`,
    );
    return rows.map(mapVocabularyRow);
  }

  const pattern = `%${trimmed}%`;
  const rows = await db.getAllAsync<VocabularyRow>(
    `SELECT *
     FROM vocabulary
     WHERE arabic_word LIKE ? OR meaning LIKE ?
     ORDER BY datetime(updated_at) DESC;`,
    pattern,
    pattern,
  );
  return rows.map(mapVocabularyRow);
}

export async function findVocabularyById(id: string): Promise<Vocabulary | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<VocabularyRow>(
    'SELECT * FROM vocabulary WHERE id = ? LIMIT 1;',
    id,
  );
  return row ? mapVocabularyRow(row) : null;
}

export async function insertVocabulary(
  id: string,
  input: VocabularyInput,
  timestamps: { createdAt: string; updatedAt: string },
): Promise<Vocabulary> {
  const db = await getDatabase();

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
    id,
    input.arabicWord,
    input.meaning,
    input.exampleSentence ?? null,
    input.description ?? null,
    input.imageUri ?? null,
    timestamps.createdAt,
    timestamps.updatedAt,
  );

  const created = await findVocabularyById(id);
  if (!created) {
    throw new Error('Failed to create vocabulary entry', { cause: { id } });
  }

  return created;
}

export async function updateVocabulary(
  id: string,
  input: VocabularyInput,
  updatedAt: string,
): Promise<Vocabulary> {
  const db = await getDatabase();

  const result = await db.runAsync(
    `UPDATE vocabulary
     SET arabic_word = ?,
         meaning = ?,
         example_sentence = ?,
         description = ?,
         image_uri = ?,
         updated_at = ?
     WHERE id = ?;`,
    input.arabicWord,
    input.meaning,
    input.exampleSentence ?? null,
    input.description ?? null,
    input.imageUri ?? null,
    updatedAt,
    id,
  );

  if (result.changes === 0) {
    throw new Error('Vocabulary not found', { cause: { id } });
  }

  const updated = await findVocabularyById(id);
  if (!updated) {
    throw new Error('Failed to load updated vocabulary', { cause: { id } });
  }

  return updated;
}

export async function deleteVocabulary(id: string): Promise<void> {
  const db = await getDatabase();
  const result = await db.runAsync('DELETE FROM vocabulary WHERE id = ?;', id);

  if (result.changes === 0) {
    throw new Error('Vocabulary not found', { cause: { id } });
  }
}
