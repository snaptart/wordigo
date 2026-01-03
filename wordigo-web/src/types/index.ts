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
}

export interface CompleteGameResponse {
  finalScore: number;
  correctWords: number;
  totalWords: number;
  timeBonus: number;
  wordPoints: number;
}

export interface FetchNextBatchResponse {
  words: PreloadedWord[];
  totalFetched: number;
}
