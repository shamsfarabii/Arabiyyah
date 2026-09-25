import type { ReviewDirection } from '@/features/review/types';
import { shuffle, type RandomGenerator } from '@/features/quiz/utils/random';

export function assignReviewDirections(
  cardCount: number,
  random: RandomGenerator = Math.random,
): ReviewDirection[] {
  const count = Math.max(0, Math.floor(cardCount));
  if (count === 0) {
    return [];
  }

  const arabicFirstCount = Math.ceil(count / 2);
  const meaningFirstCount = count - arabicFirstCount;

  const directions: ReviewDirection[] = [
    ...Array.from({ length: arabicFirstCount }, () => 'arabic_to_meaning' as const),
    ...Array.from({ length: meaningFirstCount }, () => 'meaning_to_arabic' as const),
  ];

  return shuffle(directions, random);
}
