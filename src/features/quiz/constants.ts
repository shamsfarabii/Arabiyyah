export const QUESTION_TIME_LIMIT_SECONDS = 10;

export const COUNTDOWN_TICK_INTERVAL_MS = 200;

export const QUIZ_OPTION_COUNT = 4;

export const MIN_QUIZ_OPTION_COUNT = 2;

export const MIN_QUIZ_VOCABULARY_COUNT = MIN_QUIZ_OPTION_COUNT;

export const QUIZ_SELECTION_WEIGHTS = {
  base: 1,
  wrongRateWeight: 4,
  wrongCountWeight: 0.5,
  wrongCountCap: 6,
  unseenBonus: 3,
} as const;
