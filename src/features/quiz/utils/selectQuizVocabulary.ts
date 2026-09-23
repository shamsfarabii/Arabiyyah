import { QUIZ_SELECTION_WEIGHTS } from '@/features/quiz/constants';
import type { QuizCandidateStats, WeightedVocabulary } from '@/features/quiz/types/quiz.types';
import { shuffle, type RandomGenerator } from '@/features/quiz/utils/random';

/**
 * Difficulty weight for one vocabulary word.
 *
 * Two error signals are combined on purpose:
 *  - `wrongRate` captures "the user reliably fails this word" even when the
 *    word has only been seen a couple of times.
 *  - `wrongCount` captures accumulated struggle, capped so a single very weak
 *    word cannot permanently dominate the draw.
 *
 * Never-attempted words get a fixed bonus so new vocabulary enters the cycle
 * quickly, while the non-zero base keeps mastered words in occasional rotation.
 */
export function calculateSelectionWeight(stats: QuizCandidateStats): number {
  const { base, wrongRateWeight, wrongCountWeight, wrongCountCap, unseenBonus } =
    QUIZ_SELECTION_WEIGHTS;

  const totalAttempts = Math.max(stats.totalAttempts, 0);
  const wrongCount = Math.max(stats.wrongCount, 0);
  const wrongRate = wrongCount / Math.max(totalAttempts, 1);

  return (
    base +
    wrongRateWeight * wrongRate +
    wrongCountWeight * Math.min(wrongCount, wrongCountCap) +
    (totalAttempts === 0 ? unseenBonus : 0)
  );
}

function pickWeightedIndex(weights: number[], random: RandomGenerator): number {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  if (totalWeight <= 0) {
    return Math.min(Math.floor(random() * weights.length), weights.length - 1);
  }

  let threshold = random() * totalWeight;

  for (let index = 0; index < weights.length; index += 1) {
    threshold -= weights[index];
    if (threshold < 0) {
      return index;
    }
  }

  // Only reachable through floating-point drift.
  return weights.length - 1;
}

/**
 * Weighted random selection without replacement, so a word can never appear
 * twice in the same quiz. The result is shuffled afterwards because draw order
 * correlates with weight, and question order should not leak difficulty.
 */
export function selectQuizVocabulary<T extends WeightedVocabulary>(
  candidates: readonly T[],
  questionCount: number,
  random: RandomGenerator = Math.random,
): T[] {
  const requested = Math.floor(questionCount);

  if (!Number.isFinite(requested) || requested <= 0 || candidates.length === 0) {
    return [];
  }

  const remaining = [...candidates];
  const weights = remaining.map((candidate) => calculateSelectionWeight(candidate.stats));
  const drawCount = Math.min(requested, remaining.length);
  const selected: T[] = [];

  for (let draw = 0; draw < drawCount; draw += 1) {
    const index = pickWeightedIndex(weights, random);
    selected.push(remaining[index]);

    remaining.splice(index, 1);
    weights.splice(index, 1);
  }

  return shuffle(selected, random);
}
