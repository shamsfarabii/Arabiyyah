import { MIN_QUIZ_OPTION_COUNT, QUIZ_OPTION_COUNT } from '@/features/quiz/constants';
import type {
  QuizOption,
  QuizQuestionDraft,
  QuizVocabularyCandidate,
} from '@/features/quiz/types/quiz.types';
import { shuffle, type RandomGenerator } from '@/features/quiz/utils/random';

function normalizeMeaning(meaning: string): string {
  return meaning.trim().toLowerCase();
}

function toOption(candidate: QuizVocabularyCandidate): QuizOption {
  return { id: candidate.vocabularyId, label: candidate.meaning.trim() };
}

/**
 * Turns selected vocabulary into multiple-choice questions.
 *
 * Distractors are other words from the same collection, de-duplicated by
 * meaning so a question can never show two labels that are both correct.
 * When the collection is small the question simply shows fewer options rather
 * than failing.
 */
export function buildQuizQuestions(
  selected: readonly QuizVocabularyCandidate[],
  pool: readonly QuizVocabularyCandidate[],
  random: RandomGenerator = Math.random,
): QuizQuestionDraft[] {
  return selected.map((candidate, position) => {
    const correctMeaning = normalizeMeaning(candidate.meaning);
    const seenMeanings = new Set([correctMeaning]);
    const distractorPool: QuizVocabularyCandidate[] = [];

    for (const other of pool) {
      if (other.vocabularyId === candidate.vocabularyId) {
        continue;
      }

      const meaning = normalizeMeaning(other.meaning);
      if (seenMeanings.has(meaning)) {
        continue;
      }

      seenMeanings.add(meaning);
      distractorPool.push(other);
    }

    const distractors = shuffle(distractorPool, random).slice(0, QUIZ_OPTION_COUNT - 1);
    const options = shuffle([toOption(candidate), ...distractors.map(toOption)], random);

    return {
      position,
      vocabularyId: candidate.vocabularyId,
      promptWord: candidate.arabicWord,
      correctAnswer: candidate.meaning.trim(),
      options,
    };
  });
}

/** True when the collection can produce a question with at least one distractor. */
export function hasEnoughVocabularyForQuiz(availableCount: number): boolean {
  return availableCount >= MIN_QUIZ_OPTION_COUNT;
}
