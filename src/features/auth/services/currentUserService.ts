import { getDatabase } from '@/db/database';
import { toIsoNow } from '@/utils/dates';

/**
 * The app is currently a single-device, offline SQLite app with no sign-in.
 * Learning statistics are still scoped to a user row so that a real auth
 * provider can be dropped in later without another data migration: every
 * quiz table carries `user_id`, and every query filters on it.
 */
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
      // Allow a retry after a transient failure instead of caching the rejection.
      currentUserIdPromise = null;
      throw error;
    });
  }

  return currentUserIdPromise;
}
