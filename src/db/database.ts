import * as SQLite from 'expo-sqlite';

import { runMigrations } from '@/db/migrations';
import { seedVocabulary } from '@/db/seed/seedVocabulary';

const DATABASE_NAME = 'my-arabic.db';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await runMigrations(db);
  return db;
}

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabase();
  }

  return databasePromise;
}

export async function initializeDatabase(): Promise<void> {
  await getDatabase();
}
