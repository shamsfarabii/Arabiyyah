import type { AppDatabase } from '@/db/types';

export async function resetAllLearningProgress(
  db: AppDatabase,
  userId: string,
  resetAtIso: string,
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM vocabulary_stats WHERE user_id = ?;', userId);
    await db.runAsync('DELETE FROM quiz_attempt WHERE user_id = ?;', userId);
    await db.runAsync('DELETE FROM review_session;');
    await db.runAsync(
      `UPDATE vocabulary_review
       SET review_level = 0,
           correct_count = 0,
           incorrect_count = 0,
           next_review_at = ?;`,
      resetAtIso,
    );
  });
}
