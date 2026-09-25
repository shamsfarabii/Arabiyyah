import { getDatabase } from '@/db/database';
import { toIsoNow } from '@/utils/dates';

export const LOCAL_USER_ID = 'local-user';

const LOCAL_USER_DISPLAY_NAME = 'Me';

let currentUserIdPromise: Promise<string> | null = null;

async function ensureLocalUser(): Promise<string> {
  const db = await getDatabase();

  await db.runAsync(
    `INSERT OR IGNORE INTO app_user (id, display_name, created_at)
     VALUES (?, ?, ?);`,
    LOCAL_USER_ID,
    LOCAL_USER_DISPLAY_NAME,
    toIsoNow(),
  );

  return LOCAL_USER_ID;
}

export function getCurrentUserId(): Promise<string> {
  if (!currentUserIdPromise) {
    currentUserIdPromise = ensureLocalUser().catch((error: unknown) => {
      currentUserIdPromise = null;
      throw error;
    });
  }

  return currentUserIdPromise;
}
