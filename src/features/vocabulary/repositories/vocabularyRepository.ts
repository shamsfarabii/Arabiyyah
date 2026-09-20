import { getDatabase } from '@/db/database';
import type {
  Vocabulary,
  VocabularyExample,
  VocabularyInput,
} from '@/features/vocabulary/types';
import { createId } from '@/utils/createId';

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

type VocabularyExampleRow = {
  vocabulary_id: string;
  sentence: string;
  meaning: string | null;
  sort_order: number;
};

function mapVocabularyRow(row: VocabularyRow): Vocabulary {
  return {
    id: row.id,
    arabicWord: row.arabic_word,
    meaning: row.meaning,
    examples: [],
    description: row.description ?? undefined,
    imageUri: row.image_uri ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapExampleRow(row: VocabularyExampleRow): VocabularyExample {
  return {
    sentence: row.sentence,
    meaning: row.meaning ?? undefined,
  };
}

async function findExamplesByVocabularyIds(
  vocabularyIds: string[],
): Promise<Map<string, VocabularyExample[]>> {
  const examplesByVocabularyId = new Map<string, VocabularyExample[]>();

  if (vocabularyIds.length === 0) {
    return examplesByVocabularyId;
  }

  const db = await getDatabase();
  const placeholders = vocabularyIds.map(() => '?').join(', ');
  const rows = await db.getAllAsync<VocabularyExampleRow>(
    `SELECT vocabulary_id, sentence, meaning, sort_order
     FROM vocabulary_example
     WHERE vocabulary_id IN (${placeholders})
     ORDER BY sort_order ASC;`,
    ...vocabularyIds,
  );

  for (const row of rows) {
    const existing = examplesByVocabularyId.get(row.vocabulary_id) ?? [];
    existing.push(mapExampleRow(row));
    examplesByVocabularyId.set(row.vocabulary_id, existing);
  }

  return examplesByVocabularyId;
}

export async function enrichVocabularyWithExamples(
  vocabularies: Vocabulary[],
): Promise<Vocabulary[]> {
  if (vocabularies.length === 0) {
    return vocabularies;
  }

  const examplesById = await findExamplesByVocabularyIds(
    vocabularies.map((vocabulary) => vocabulary.id),
  );

  return vocabularies.map((vocabulary) => ({
    ...vocabulary,
    examples: examplesById.get(vocabulary.id) ?? [],
  }));
}

async function replaceVocabularyExamples(
  vocabularyId: string,
  examples: VocabularyExample[],
): Promise<void> {
  const db = await getDatabase();

  await db.runAsync('DELETE FROM vocabulary_example WHERE vocabulary_id = ?;', vocabularyId);

  for (let index = 0; index < examples.length; index += 1) {
    const example = examples[index];
    await db.runAsync(
      `INSERT INTO vocabulary_example (
        id,
        vocabulary_id,
        sentence,
        meaning,
        sort_order
      ) VALUES (?, ?, ?, ?, ?);`,
      createId(),
      vocabularyId,
      example.sentence,
      example.meaning ?? null,
      index,
    );
  }
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
  return enrichVocabularyWithExamples(rows.map(mapVocabularyRow));
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
    return enrichVocabularyWithExamples(rows.map(mapVocabularyRow));
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
  return enrichVocabularyWithExamples(rows.map(mapVocabularyRow));
}

export async function findVocabularyById(id: string): Promise<Vocabulary | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<VocabularyRow>(
    'SELECT * FROM vocabulary WHERE id = ? LIMIT 1;',
    id,
  );

  if (!row) {
    return null;
  }

  const [vocabulary] = await enrichVocabularyWithExamples([mapVocabularyRow(row)]);
  return vocabulary ?? null;
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
    null,
    input.description ?? null,
    input.imageUri ?? null,
    timestamps.createdAt,
    timestamps.updatedAt,
  );

  await replaceVocabularyExamples(id, input.examples);

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
    null,
    input.description ?? null,
    input.imageUri ?? null,
    updatedAt,
    id,
  );

  if (result.changes === 0) {
    throw new Error('Vocabulary not found', { cause: { id } });
  }

  await replaceVocabularyExamples(id, input.examples);

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
