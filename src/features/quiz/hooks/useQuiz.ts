import { useCallback, useEffect, useReducer, useRef } from 'react';

import { QUESTION_TIME_LIMIT_SECONDS } from '@/features/quiz/constants';
import { useQuizTimer } from '@/features/quiz/hooks/useQuizTimer';
import { toErrorMessage } from '@/features/quiz/services/quizErrors';
import {
  completeQuiz,
  startQuiz,
  submitQuizAnswer,
} from '@/features/quiz/services/quizService';
import type {
  QuizAnswerOutcome,
  QuizQuestion,
  QuizResult,
  QuizSession,
  QuizStatus,
} from '@/features/quiz/types/quiz.types';

type QuizState = {
  status: QuizStatus;
  session: QuizSession | null;
  currentQuestionIndex: number;
  answers: QuizAnswerOutcome[];
  revealedAnswer: QuizAnswerOutcome | null;
  isSubmitting: boolean;
  submitError: string | null;
  loadError: string | null;
  result: QuizResult | null;
  pendingSubmission: PendingSubmission | null;
};

type PendingSubmission = {
  position: number;
  selectedOptionId: string | null;
};

type QuizAction =
  | { type: 'loading' }
  | { type: 'loaded'; session: QuizSession }
  | { type: 'load-failed'; message: string }
  | { type: 'submit-started'; submission: PendingSubmission | null }
  | { type: 'answer-recorded'; outcome: QuizAnswerOutcome }
  | { type: 'submit-failed'; message: string }
  | { type: 'next-question' }
  | { type: 'completed'; result: QuizResult };

const initialState: QuizState = {
  status: 'idle',
  session: null,
  currentQuestionIndex: 0,
  answers: [],
  revealedAnswer: null,
  isSubmitting: false,
  submitError: null,
  loadError: null,
  result: null,
  pendingSubmission: null,
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'loading':
      return { ...initialState, status: 'loading' };
    case 'loaded':
      return { ...initialState, status: 'running', session: action.session };
    case 'load-failed':
      return { ...state, status: 'error', loadError: action.message, isSubmitting: false };
    case 'submit-started':
      return {
        ...state,
        isSubmitting: true,
        submitError: null,
        pendingSubmission: action.submission,
      };
    case 'answer-recorded': {
      const alreadyRecorded = state.answers.some(
        (answer) => answer.position === action.outcome.position,
      );

      return {
        ...state,
        isSubmitting: false,
        submitError: null,
        pendingSubmission: null,
        revealedAnswer: action.outcome,
        answers: alreadyRecorded ? state.answers : [...state.answers, action.outcome],
      };
    }
    case 'submit-failed':
      return { ...state, isSubmitting: false, submitError: action.message };
    case 'next-question':
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        revealedAnswer: null,
        submitError: null,
      };
    case 'completed':
      return { ...state, status: 'completed', isSubmitting: false, result: action.result };
    default:
      return state;
  }
}

export type UseQuizValue = {
  status: QuizStatus;
  currentQuestion: QuizQuestion | null;
  questionNumber: number;
  totalQuestions: number;
  correctCount: number;
  answeredCount: number;
  revealedAnswer: QuizAnswerOutcome | null;
  remainingSeconds: number;
  isSubmitting: boolean;
  submitError: string | null;
  loadError: string | null;
  result: QuizResult | null;
  isLastQuestion: boolean;
  canRetrySubmit: boolean;
  answerQuestion: (optionId: string) => void;
  retrySubmit: () => void;
  goToNextQuestion: () => void;
  retryStart: () => void;
};

/**
 * Owns the transient quiz state: which question is showing, what the countdown
 * says, and what was revealed. Nothing here is persisted; every durable write
 * goes through the quiz service, which is also the only place a score is
 * calculated.
 */
export function useQuiz(questionCount: number): UseQuizValue {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  const isMountedRef = useRef(true);
  const isSubmittingRef = useRef(false);
  const answeredPositionsRef = useRef(new Set<number>());

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadQuiz = useCallback(async () => {
    dispatch({ type: 'loading' });
    isSubmittingRef.current = false;
    answeredPositionsRef.current = new Set<number>();

    try {
      const session = await startQuiz(questionCount);
      if (isMountedRef.current) {
        dispatch({ type: 'loaded', session });
      }
    } catch (error: unknown) {
      if (isMountedRef.current) {
        dispatch({
          type: 'load-failed',
          message: toErrorMessage(error, 'Could not start the quiz.'),
        });
      }
    }
  }, [questionCount]);

  useEffect(() => {
    void loadQuiz();
  }, [loadQuiz]);

  const questions = state.session?.questions ?? [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[state.currentQuestionIndex] ?? null;
  const attemptId = state.session?.attempt.id ?? null;

  /**
   * The refs are the first line of defence against counting a question twice:
   * they are updated synchronously, so a second tap or an expiring timer in the
   * same render cycle is dropped before it ever reaches the database.
   */
  const submitAnswer = useCallback(
    async (position: number, selectedOptionId: string | null) => {
      if (!attemptId || isSubmittingRef.current || answeredPositionsRef.current.has(position)) {
        return;
      }

      isSubmittingRef.current = true;
      dispatch({ type: 'submit-started', submission: { position, selectedOptionId } });

      try {
        const outcome = await submitQuizAnswer({
          quizAttemptId: attemptId,
          position,
          selectedOptionId,
        });

        answeredPositionsRef.current.add(position);

        if (isMountedRef.current) {
          dispatch({ type: 'answer-recorded', outcome });
        }
      } catch (error: unknown) {
        if (isMountedRef.current) {
          dispatch({
            type: 'submit-failed',
            message: toErrorMessage(error, 'Could not save your answer.'),
          });
        }
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [attemptId],
  );

  const isQuestionOpen =
    state.status === 'running' && currentQuestion !== null && state.revealedAnswer === null;

  const handleExpire = useCallback(() => {
    if (currentQuestion) {
      void submitAnswer(currentQuestion.position, null);
    }
  }, [currentQuestion, submitAnswer]);

  const remainingSeconds = useQuizTimer({
    durationSeconds: QUESTION_TIME_LIMIT_SECONDS,
    questionKey: currentQuestion?.id ?? null,
    isActive: isQuestionOpen,
    onExpire: handleExpire,
  });

  const answerQuestion = useCallback(
    (optionId: string) => {
      if (currentQuestion) {
        void submitAnswer(currentQuestion.position, optionId);
      }
    },
    [currentQuestion, submitAnswer],
  );

  // A failed save keeps the submission so it can be retried; the database
  // guard makes a retry safe even if the first write actually landed.
  const pendingSubmission = state.pendingSubmission;

  const retrySubmit = useCallback(() => {
    if (pendingSubmission) {
      void submitAnswer(pendingSubmission.position, pendingSubmission.selectedOptionId);
    }
  }, [pendingSubmission, submitAnswer]);

  const isLastQuestion = totalQuestions > 0 && state.currentQuestionIndex >= totalQuestions - 1;

  const goToNextQuestion = useCallback(() => {
    if (!state.session || state.isSubmitting) {
      return;
    }

    if (!isLastQuestion) {
      dispatch({ type: 'next-question' });
      return;
    }

    const { attempt } = state.session;

    const finish = async () => {
      dispatch({ type: 'submit-started', submission: null });

      try {
        const result = await completeQuiz(attempt.id);
        if (isMountedRef.current) {
          dispatch({ type: 'completed', result });
        }
      } catch (error: unknown) {
        if (isMountedRef.current) {
          dispatch({
            type: 'submit-failed',
            message: toErrorMessage(error, 'Could not finish the quiz.'),
          });
        }
      }
    };

    void finish();
  }, [isLastQuestion, state.isSubmitting, state.session]);

  return {
    status: state.status,
    currentQuestion,
    questionNumber: state.currentQuestionIndex + 1,
    totalQuestions,
    correctCount: state.answers.filter((answer) => answer.wasCorrect).length,
    answeredCount: state.answers.length,
    revealedAnswer: state.revealedAnswer,
    remainingSeconds,
    isSubmitting: state.isSubmitting,
    submitError: state.submitError,
    loadError: state.loadError,
    result: state.result,
    isLastQuestion,
    canRetrySubmit: state.submitError !== null && pendingSubmission !== null,
    answerQuestion,
    retrySubmit,
    goToNextQuestion,
    retryStart: () => void loadQuiz(),
  };
}
