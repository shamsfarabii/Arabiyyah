export type QuizCandidateStats = {
  correctCount: number;
  wrongCount: number;
  totalAttempts: number;
};

export type WeightedVocabulary = {
  vocabularyId: string;
  stats: QuizCandidateStats;
};

export type QuizVocabularyCandidate = WeightedVocabulary & {
  arabicWord: string;
  meaning: string;
};

export type QuizOption = {
  id: string;
  label: string;
};

export type QuizQuestionDraft = {
  position: number;
  vocabularyId: string;
  promptWord: string;
  correctAnswer: string;
  options: QuizOption[];
};

export type QuizQuestion = QuizQuestionDraft & {
  id: string;
};

export type QuizQuestionRecord = {
  id: string;
  position: number;
  vocabularyId: string | null;
  correctOptionId: string;
  promptWord: string;
  correctAnswer: string;
  options: QuizOption[];
  selectedOptionId: string | null;
  selectedAnswer: string | null;
  wasCorrect: boolean | null;
  timedOut: boolean | null;
  answeredAt: string | null;
};

export type QuizAttempt = {
  id: string;
  userId: string;
  startedAt: string;
  completedAt: string | null;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
};

export type QuizSession = {
  attempt: QuizAttempt;
  questions: QuizQuestion[];
};

export type QuizAnswerOutcome = {
  position: number;
  selectedOptionId: string | null;
  selectedAnswer: string | null;
  correctAnswer: string;
  wasCorrect: boolean;
  timedOut: boolean;
  answeredAt: string;
};

export type QuizAnswerRecord = QuizAnswerOutcome & {
  vocabularyId: string | null;
  promptWord: string;
};

export type QuizResult = {
  attempt: QuizAttempt;
  answers: QuizAnswerRecord[];
  accuracyPercent: number;
};

export type VocabularyLearningStats = {
  vocabularyId: string;
  correctAnswerCount: number;
  wrongAnswerCount: number;
  totalAttemptCount: number;
  lastAttemptedAt: string | null;
};

export type PracticeSummary = {
  answeredCount: number;
  accuracyPercent: number | null;
};

export type QuizStatus = 'idle' | 'loading' | 'running' | 'completed' | 'error';
