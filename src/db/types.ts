export type SqlParam = string | number | null;

export type AppDatabase = {
  getFirstAsync<T>(source: string, ...params: SqlParam[]): Promise<T | null>;
  getAllAsync<T>(source: string, ...params: SqlParam[]): Promise<T[]>;
  runAsync(source: string, ...params: SqlParam[]): Promise<{ changes: number }>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
};
