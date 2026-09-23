import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import {
  findVocabularyByIds,
  searchVocabulary,
} from '@/features/vocabulary/repositories/vocabularyRepository';
import {
  toValidatedVocabularyInput,
  vocabularyExportFileSchema,
  type VocabularyExportFile,
  type VocabularyExportItem,
} from '@/features/vocabulary/schemas/vocabularyExportSchema';
import { createVocabulary } from '@/features/vocabulary/services/vocabularyService';
import type { Vocabulary } from '@/features/vocabulary/types';
import { toIsoNow } from '@/utils/dates';

const EXPORT_APP_ID = 'my-arabic' as const;
const EXPORT_FORMAT_VERSION = 1 as const;

export type ImportDuplicateStrategy = 'skip' | 'import';

export type ImportVocabularyResult = {
  importedCount: number;
  skippedDuplicateCount: number;
  totalInFile: number;
};

function vocabularyIdentityKey(arabicWord: string, meaning: string): string {
  return `${arabicWord.trim()}\u0000${meaning.trim().toLowerCase()}`;
}

function toExportItem(vocabulary: Vocabulary): VocabularyExportItem {
  return {
    arabicWord: vocabulary.arabicWord,
    meaning: vocabulary.meaning,
    examples: vocabulary.examples.map((example) => ({
      sentence: example.sentence,
      meaning: example.meaning,
    })),
    description: vocabulary.description,
  };
}

export function buildExportFile(vocabularies: Vocabulary[]): VocabularyExportFile {
  if (vocabularies.length === 0) {
    throw new Error('Nothing to export. Add or select vocabulary first.');
  }

  return {
    formatVersion: EXPORT_FORMAT_VERSION,
    app: EXPORT_APP_ID,
    exportedAt: toIsoNow(),
    items: vocabularies.map(toExportItem),
  };
}

export async function loadVocabularyForExport(ids?: string[]): Promise<Vocabulary[]> {
  if (ids && ids.length > 0) {
    return findVocabularyByIds(ids);
  }

  return searchVocabulary('');
}

function buildExportFileName(exportedAt: string): string {
  const datePart = exportedAt.slice(0, 10);
  return `my-arabic-vocabulary-${datePart}.json`;
}

export async function shareVocabularyExport(vocabularies: Vocabulary[]): Promise<void> {
  const payload = buildExportFile(vocabularies);
  const json = `${JSON.stringify(payload, null, 2)}\n`;
  const fileName = buildExportFileName(payload.exportedAt);
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (Platform.OS === 'web') {
    if (typeof document === 'undefined') {
      throw new Error('Export is not supported in this environment.');
    }

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
    return;
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/json',
    dialogTitle: 'Share vocabulary collection',
    UTI: 'public.json',
  });
}

function parseExportFileContents(raw: string): VocabularyExportFile {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch (error: unknown) {
    throw new Error('Invalid file. Expected a JSON vocabulary export.', { cause: error });
  }

  const result = vocabularyExportFileSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error('Unrecognized vocabulary file format.');
  }

  return result.data;
}

async function readPickedFileAsText(uri: string): Promise<string> {
  try {
    return await new File(uri).text();
  } catch (error: unknown) {
    try {
      return await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
    } catch {
      throw error;
    }
  }
}

export async function pickAndParseVocabularyImportFile(): Promise<VocabularyExportFile | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    // Android file managers often report .json files as octet-stream or text/plain.
    type: ['application/json', 'text/plain', 'application/octet-stream'],
    // On Android, read the picker's content:// URI directly: the picker grants read access to it,
    // whereas reading the cached copy fails with "Missing 'READ' permission" / java.io errors.
    copyToCacheDirectory: Platform.OS !== 'android',
    multiple: false,
  });

  if (picked.canceled || !picked.assets[0]) {
    return null;
  }

  const asset = picked.assets[0];
  const raw = asset.file ? await asset.file.text() : await readPickedFileAsText(asset.uri);

  return parseExportFileContents(raw);
}

export async function importVocabularyFromFile(
  file: VocabularyExportFile,
  duplicateStrategy: ImportDuplicateStrategy,
): Promise<ImportVocabularyResult> {
  const existing = await searchVocabulary('');
  const existingKeys = new Set(
    existing.map((item) => vocabularyIdentityKey(item.arabicWord, item.meaning)),
  );

  let importedCount = 0;
  let skippedDuplicateCount = 0;

  for (const item of file.items) {
    const key = vocabularyIdentityKey(item.arabicWord, item.meaning);
    const isDuplicate = existingKeys.has(key);

    if (isDuplicate && duplicateStrategy === 'skip') {
      skippedDuplicateCount += 1;
      continue;
    }

    const validated = toValidatedVocabularyInput(item);
    await createVocabulary(validated);
    existingKeys.add(key);
    importedCount += 1;
  }

  return {
    importedCount,
    skippedDuplicateCount,
    totalInFile: file.items.length,
  };
}
