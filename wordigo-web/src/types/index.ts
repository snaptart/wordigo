export interface WordResponse {
  correctWord: {
    senseid: number;
    word: string;
    definition: string;
  };
  wrongWord: {
    senseid: number;
    word: string;
    definition: string;
  };
  historyId: number;
  gameId: number;
  defOrder: number;
  timer: number;
  strikes: number;
}

export interface AnswerResponse {
  correct: boolean;
  strikes: number;
  gameOver: boolean;
}

// New game format types

export interface DifficultyPreset {
  id: number;
  name: string;
  displayName: string;
  wordCount: number;
  timeLimit: number;
  difficultyBand: number | null;
  description: string | null;
  isActive: boolean;
}

export interface PreloadedWord {
  correctWord: {
    senseid: number;
    word: string;
    goodDefinition: string;
    strategy: string;
    def_avg_read_score_band?: number | null;
    difficulty_band?: number | null;
    overall_difficulty_score?: number | null;
    word_in_definition?: boolean | null;
    simpleCategory?: string | null;
    pos?: string;
    posName?: string;
    pronunciation?: {
      ipa: string;
      syllables: string[];
      syllableCount: number;
      formattedSyllables: string;
    };
  };
  wrongWords: Array<{
    senseid: number;
    word: string;
    badDefinition: string;
    strategy: string;
    def_avg_read_score_band?: number | null;
    difficulty_band?: number | null;
    overall_difficulty_score?: number | null;
    word_in_definition?: boolean | null;
    simpleCategory?: string | null;
    pos?: string;
    posName?: string;
    pronunciation?: {
      ipa: string;
      syllables: string[];
      syllableCount: number;
      formattedSyllables: string;
    };
  }>;
  defOrder: number;
  timer: number;
  historyId: number;
}

export interface StartGameResponse {
  gameId: number;
  difficulty: string;
  totalWords: number;
  timeLimit: number;
  timerEnabled: boolean;
  words: PreloadedWord[];
}

export interface SubmitWordResponse {
  correct: boolean;
  strikes: number;
  gameOver: boolean;
  reason?: 'strikes' | 'timeout';
  pointsEarned: number;       // Points earned for this word
  hintsRemaining: number;     // Updated hint count after this answer
  sessionScore: number;       // Running total score for the game
}

export interface CompleteGameResponse {
  finalScore: number;
  sessionScore: number;          // Session score (same as finalScore with new system)
  correctWords: number;
  totalWords: number;
  timeBonus: number;             // Deprecated: kept for backward compatibility
  wordPoints: number;            // Deprecated: kept for backward compatibility
  totalPointsAllTime?: number;   // Only for logged-in users
}

export interface FetchNextBatchResponse {
  words: PreloadedWord[];
  totalFetched: number;
}

// Game History types

export interface WordDefinition {
  senseid: number;
  word: string;
  definition: string;
  difficultyBand?: number | null;
  difficultyScore?: number | null;
}

export interface WordHistoryEntry {
  historyId: number;
  defOrder: number;
  correctWord: WordDefinition;
  wrongDefinitions: WordDefinition[];
  userSelection: WordDefinition | null;
  isCorrect: boolean;
  selectionStrategy: string;
  timeToAnswer: number | null;
  createdAt: Date;
}

export interface GameHistoryEntry {
  gameId: number;
  difficulty: string;
  totalWords: number;
  wordsCompleted: number;
  correctWords: number;
  finalScore: number;
  timeLimit: number;
  timeRemaining: number;
  timerEnabled: boolean;
  gameStatus: string;
  failReason: string | null;
  createdAt: Date;
  completedAt: Date | null;
  accuracy: number;
  words: WordHistoryEntry[];
}

export interface GameHistoryResponse {
  games: GameHistoryEntry[];
  pagination: {
    page: number;
    limit: number;
    totalGames: number;
    totalPages: number;
  };
}
