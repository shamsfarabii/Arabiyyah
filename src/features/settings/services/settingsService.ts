import { getDatabase } from '@/db/database';
import { getCurrentUserId } from '@/features/auth/services/currentUserService';
import { resetAllLearningProgress } from '@/features/settings/repositories/progressResetRepository';
import { toIsoNow } from '@/utils/dates';

export async function resetUserProgress(): Promise<void> {
  const db = await getDatabase();
  const userId = await getCurrentUserId();
  await resetAllLearningProgress(db, userId, toIsoNow());
}
