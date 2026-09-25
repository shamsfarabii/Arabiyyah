export type RandomGenerator = () => number;

export function shuffle<T>(items: readonly T[], random: RandomGenerator = Math.random): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const clampedIndex = Math.min(Math.max(swapIndex, 0), index);
    const current = result[index];
    result[index] = result[clampedIndex];
    result[clampedIndex] = current;
  }

  return result;
}
