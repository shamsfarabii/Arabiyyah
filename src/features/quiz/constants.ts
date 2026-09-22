/** Seconds allowed per question before it is auto-submitted as wrong. */
export const QUESTION_TIME_LIMIT_SECONDS = 10;

/** How often the countdown recomputes the remaining seconds from the deadline. */
export const COUNTDOWN_TICK_INTERVAL_MS = 200;

/** Preferred number of multiple-choice options, reduced when vocabulary is scarce. */
export const QUIZ_OPTION_COUNT = 4;

/**
 * A multiple-choice question needs at least one distractor, so a quiz needs at
 * least two distinct vocabulary meanings before it can be started.
 */
export const MIN_QUIZ_OPTION_COUNT = 2;

export const MIN_QUIZ_VOCABULARY_COUNT = MIN_QUIZ_OPTION_COUNT;

/**
 * Weights for adaptive question selection.
 *
 * weight = base
 *        + wrongRateWeight * (wrongCount / max(totalAttempts, 1))
 *        + wrongCountWeight * min(wrongCount, wrongCountCap)
 *        + unseenBonus (only when the word was never attempted)
 *
 * `base` is never zero, so a mastered word keeps a small but real chance of
 * appearing. `wrongCountCap` stops one disastrous word from crowding out the
 * rest of the collection forever.
 */
export const QUIZ_SELECTION_WEIGHTS = {
  base: 1,
  wrongRateWeight: 4,
  wrongCountWeight: 0.5,
  wrongCountCap: 6,
  unseenBonus: 3,
} as const;
