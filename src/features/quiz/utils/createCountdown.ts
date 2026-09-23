import { COUNTDOWN_TICK_INTERVAL_MS } from '@/features/quiz/constants';

export type CountdownHandle = {
  stop: () => void;
};

export type CountdownScheduler = {
  setInterval: (callback: () => void, intervalMs: number) => unknown;
  clearInterval: (handle: unknown) => void;
};

export type CountdownOptions = {
  durationSeconds: number;
  onTick: (remainingSeconds: number) => void;
  onExpire: () => void;
  now?: () => number;
  scheduler?: CountdownScheduler;
  tickIntervalMs?: number;
};

const defaultScheduler: CountdownScheduler = {
  setInterval: (callback, intervalMs) => setInterval(callback, intervalMs),
  clearInterval: (handle) => clearInterval(handle as ReturnType<typeof setInterval>),
};

/**
 * Deadline-based countdown.
 *
 * Remaining time is derived from a wall-clock deadline rather than by
 * decrementing a counter, so a stalled JS thread cannot silently give the user
 * extra time. `onExpire` fires at most once, and `stop()` is idempotent and
 * prevents any callback that was already queued from firing afterwards, which
 * is what keeps a late timer from submitting an answered question twice.
 */
export function createCountdown({
  durationSeconds,
  onTick,
  onExpire,
  now = Date.now,
  scheduler = defaultScheduler,
  tickIntervalMs = COUNTDOWN_TICK_INTERVAL_MS,
}: CountdownOptions): CountdownHandle {
  const deadline = now() + durationSeconds * 1000;

  let isFinished = false;
  let intervalHandle: unknown = null;

  const stop = () => {
    isFinished = true;
    if (intervalHandle !== null) {
      scheduler.clearInterval(intervalHandle);
      intervalHandle = null;
    }
  };

  const remainingSeconds = () => Math.max(0, Math.ceil((deadline - now()) / 1000));

  const expire = () => {
    stop();
    onExpire();
  };

  const initialRemaining = remainingSeconds();
  onTick(initialRemaining);

  if (initialRemaining <= 0) {
    expire();
    return { stop };
  }

  intervalHandle = scheduler.setInterval(() => {
    if (isFinished) {
      return;
    }

    const remaining = remainingSeconds();
    onTick(remaining);

    if (remaining <= 0) {
      expire();
    }
  }, tickIntervalMs);

  return { stop };
}
