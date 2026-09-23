/**
 * Minimal database port used by feature repositories.
 *
 * `expo-sqlite`'s `SQLiteDatabase` satisfies this structurally, so production
 * code passes the real handle while tests can pass any adapter (see the
 * `node:sqlite` adapter used by the quiz repository tests). Keeping the port
 * this small also keeps repositories free of Expo-specific imports.
 */
export type SqlParam = string | number | null;

export type AppDatabase = {
  getFirstAsync<T>(source: string, ...params: SqlParam[]): Promise<T | null>;
  getAllAsync<T>(source: string, ...params: SqlParam[]): Promise<T[]>;
  runAsync(source: string, ...params: SqlParam[]): Promise<{ changes: number }>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
};
