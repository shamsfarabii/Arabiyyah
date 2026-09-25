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

export function hasEnoughVocabularyForQuiz(availableCount: number): boolean {
  return availableCount >= MIN_QUIZ_OPTION_COUNT;
}
