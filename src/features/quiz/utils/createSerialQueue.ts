/**
 * Runs tasks one at a time in submission order.
 *
 * Quiz writes open a SQLite transaction, and SQLite cannot nest transactions on
 * one connection. Serialising the writes makes a double tap or a retry-while-
 * saving impossible to turn into "cannot start a transaction within a
 * transaction", independent of any guard in the UI layer.
 */
export function createSerialQueue() {
  let tail: Promise<unknown> = Promise.resolve();

  return function enqueue<T>(task: () => Promise<T>): Promise<T> {
    // A failed task must not block the queue, so both settlements continue.
    const result = tail.then(task, task);
    tail = result.catch(() => undefined);
    return result;
  };
}
