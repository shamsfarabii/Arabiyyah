export type Vocabulary = {
  id: string;
  arabicWord: string;
  meaning: string;
  exampleSentence?: string;
  description?: string;
  imageUri?: string;
  createdAt: string;
  updatedAt: string;
};

export type VocabularyInput = {
  arabicWord: string;
  meaning: string;
  exampleSentence?: string;
  description?: string;
  imageUri?: string;
};

export type HomeSummary = {
  totalWords: number;
  dueReviewCount: number;
  recentlyAdded: Vocabulary[];
};
