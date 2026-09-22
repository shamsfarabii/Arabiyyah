import { router } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
} from '@/constants/theme';
import { QuizOptionButton } from '@/features/quiz/components/QuizOptionButton';
import { QuizProgress } from '@/features/quiz/components/QuizProgress';
import { QuizResultView } from '@/features/quiz/components/QuizResultView';
import { QuizTimer } from '@/features/quiz/components/QuizTimer';
import { QUESTION_TIME_LIMIT_SECONDS } from '@/features/quiz/constants';
import { useQuiz } from '@/features/quiz/hooks/useQuiz';
import type { QuizOptionState } from '@/features/quiz/components/QuizOptionButton';
import { createShadow } from '@/helpers/styleHelpers';
import { commonStyles } from '@/styles/commonStyles';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

type QuizSessionScreenProps = {
  questionCount: number;
};

export function QuizSessionScreen({ questionCount }: QuizSessionScreenProps) {
  const quiz = useQuiz(questionCount);

  const {
    currentQuestion,
    revealedAnswer,
    isSubmitting,
    submitError,
    canRetrySubmit,
  } = quiz;

  const goToSetup = () => router.replace('/quiz');

  const confirmExit = () => {
    if (quiz.status !== 'running') {
      router.back();
      return;
    }

    Alert.alert(
      'Leave this quiz?',
      'Answers you already gave are saved. The rest of the quiz will be discarded.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => router.back() },
      ],
    );
  };

  const optionState = (optionId: string): QuizOptionState => {
    if (!revealedAnswer || !currentQuestion) {
      return 'idle';
    }

    if (optionId === currentQuestion.vocabularyId) {
      return 'correct';
    }

    return revealedAnswer.selectedOptionId === optionId ? 'incorrect' : 'muted';
  };

  const feedbackTitle = () => {
    if (!revealedAnswer) {
      return '';
    }

    if (revealedAnswer.wasCorrect) {
      return 'Correct';
    }

    return revealedAnswer.timedOut ? "Time's up" : 'Not quite';
  };

  if (quiz.status === 'completed' && quiz.result) {
    return (
      <ScreenScaffold scroll={false}>
        <ScreenHeader title="Quiz Complete" />
        <QuizResultView
          result={quiz.result}
          onAttemptAnother={goToSetup}
          onBackToVocabulary={() => router.replace('/vocabulary')}
        />
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold scroll={false}>
      <ScreenHeader title="Quiz" onBack={confirmExit} />

      {quiz.status === 'loading' || quiz.status === 'idle' ? (
        <View style={[commonStyles.grow, commonStyles.centered]}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.loadingText}>Building your quiz…</Text>
        </View>
      ) : null}

      {quiz.status === 'error' ? (
        <View style={[commonStyles.grow, commonStyles.centered, styles.state]}>
          <Text style={styles.stateTitle}>Could not start the quiz</Text>
          <Text style={styles.stateBody}>{quiz.loadError}</Text>
          <PrimaryButton label="Try Again" onPress={quiz.retryStart} style={styles.stateButton} />
          <PrimaryButton
            label="Change Question Count"
            onPress={goToSetup}
            variant="secondary"
            style={styles.stateButton}
          />
        </View>
      ) : null}

      {quiz.status === 'running' && currentQuestion ? (
        <View style={commonStyles.grow}>
          <QuizProgress
            questionNumber={quiz.questionNumber}
            totalQuestions={quiz.totalQuestions}
            correctCount={quiz.correctCount}
            answeredCount={quiz.answeredCount}
          />

          <QuizTimer
            remainingSeconds={quiz.remainingSeconds}
            totalSeconds={QUESTION_TIME_LIMIT_SECONDS}
            isRunning={revealedAnswer === null}
          />

          <View style={[styles.promptCard, commonStyles.centered, cardShadow]}>
            <Text style={styles.prompt}>What does this word mean?</Text>
            <Text style={styles.arabicWord}>{currentQuestion.promptWord}</Text>
          </View>

          <View style={styles.options}>
            {currentQuestion.options.map((option, index) => (
              <QuizOptionButton
                key={option.id}
                letter={OPTION_LETTERS[index] ?? String(index + 1)}
                label={option.label}
                state={optionState(option.id)}
                disabled={revealedAnswer !== null || isSubmitting || quiz.remainingSeconds <= 0}
                onPress={() => quiz.answerQuestion(option.id)}
              />
            ))}
          </View>

          {submitError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{submitError}</Text>
              {canRetrySubmit ? (
                <Pressable onPress={quiz.retrySubmit} disabled={isSubmitting}>
                  <Text style={styles.retryLink}>Try again</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {revealedAnswer ? (
            <View
              style={[
                styles.feedback,
                revealedAnswer.wasCorrect ? styles.feedbackCorrect : styles.feedbackWrong,
              ]}
            >
              <Text
                style={[
                  styles.feedbackTitle,
                  revealedAnswer.wasCorrect
                    ? styles.feedbackTitleCorrect
                    : styles.feedbackTitleWrong,
                ]}
              >
                {feedbackTitle()}
              </Text>
              {!revealedAnswer.wasCorrect ? (
                <Text style={styles.feedbackBody}>
                  Correct answer: {revealedAnswer.correctAnswer}
                </Text>
              ) : null}
            </View>
          ) : null}

          {revealedAnswer ? (
            <PrimaryButton
              label={quiz.isLastQuestion ? 'See Results' : 'Next Question'}
              onPress={quiz.goToNextQuestion}
              disabled={isSubmitting}
            />
          ) : null}
        </View>
      ) : null}
    </ScreenScaffold>
  );
}

const cardShadow = createShadow(2, COLORS.accent, 0.06, 4);

const styles = StyleSheet.create({
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  promptCard: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.card,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  prompt: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  arabicWord: {
    fontSize: 40,
    lineHeight: 58,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.arabicWord,
    textAlign: 'center',
  },
  options: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  feedback: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  feedbackCorrect: {
    borderColor: COLORS.borderSuccess,
    backgroundColor: COLORS.surfaceSuccess,
  },
  feedbackWrong: {
    borderColor: COLORS.borderDanger,
    backgroundColor: COLORS.surfaceDanger,
  },
  feedbackTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  feedbackTitleCorrect: {
    color: COLORS.primaryLight,
  },
  feedbackTitleWrong: {
    color: COLORS.danger,
  },
  feedbackBody: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  errorBanner: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderDanger,
    backgroundColor: COLORS.surfaceDanger,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.danger,
  },
  retryLink: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  state: {
    paddingHorizontal: SPACING.lg,
  },
  stateTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  stateBody: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  stateButton: {
    alignSelf: 'stretch',
    marginTop: SPACING.md,
  },
});
