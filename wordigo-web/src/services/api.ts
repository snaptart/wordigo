import axios from 'axios';
import type {
  WordResponse,
  AnswerResponse,
  DifficultyPreset,
  StartGameResponse,
  SubmitWordResponse,
  CompleteGameResponse,
  FetchNextBatchResponse,
  GameHistoryResponse
} from '../types/index';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Add access token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wordigo_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Generate a session ID for anonymous users
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('wordigo_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('wordigo_session_id', sessionId);
  }
  return sessionId;
};

// Legacy API functions

export const getWord = async (gameId?: number): Promise<WordResponse> => {
  console.log('API Request: GET /word', gameId ? `(gameId: ${gameId})` : '');
  const response = await api.get('/word', {
    params: gameId ? { gameId } : {},
  });
  return response.data.data;
};

export const submitAnswer = async (data: {
  historyId: number;
  gameId: number;
  selectedSenseId: number;
  correctSenseId: number;
  timeRemaining: number;
}): Promise<AnswerResponse> => {
  console.log('API Request: POST /game/answer');
  try {
    const response = await api.post('/game/answer', data);
    return response.data.data;
  } catch (error) {
    console.error('API Response Error:', error);
    throw error;
  }
};

// New game format API functions

export const getDifficultyPresets = async (): Promise<DifficultyPreset[]> => {
  console.log('API Request: GET /game/presets');
  const response = await api.get('/game/presets');
  return response.data.data;
};

export const startGame = async (difficulty: string, timerEnabled: boolean = true, userId?: number): Promise<StartGameResponse> => {
  console.log('API Request: POST /game/start', { difficulty, timerEnabled, userId });
  const response = await api.post('/game/start', {
    difficulty,
    sessionId: getSessionId(),
    timerEnabled,
    userId,
  });
  return response.data.data;
};

export const createWordHistory = async (data: {
  gameId: number;
  correctSenseId: number;
  wrongSenseIds: number[];
  defOrder: number;
  timeLimit: number;
}): Promise<{ historyId: number }> => {
  console.log('API Request: POST /game/create-word-history');
  try {
    const response = await api.post('/game/create-word-history', data);
    return response.data.data;
  } catch (error) {
    console.error('API Response Error:', error);
    throw error;
  }
};

export const submitWordAnswer = async (data: {
  gameId: number;
  historyId: number;
  selectedSenseId: number;
  correctSenseId: number;
}): Promise<SubmitWordResponse> => {
  console.log('API Request: POST /game/submit-word');
  try {
    const response = await api.post('/game/submit-word', data);
    return response.data.data;
  } catch (error) {
    console.error('API Response Error:', error);
    throw error;
  }
};

export const completeGame = async (data: {
  gameId: number;
  timeRemaining: number;
  reason?: 'completed' | 'timeout' | 'strikes';
}): Promise<CompleteGameResponse> => {
  console.log('API Request: POST /game/complete');
  try {
    const response = await api.post('/game/complete', data);
    return response.data.data;
  } catch (error) {
    console.error('API Response Error:', error);
    throw error;
  }
};

export const fetchNextBatch = async (data: {
  gameId: number;
  batchSize?: number;
}): Promise<FetchNextBatchResponse> => {
  console.log('API Request: POST /game/fetch-next-batch', data);
  try {
    const response = await api.post('/game/fetch-next-batch', data);
    return response.data.data;
  } catch (error) {
    console.error('API Response Error:', error);
    throw error;
  }
};

// User Preferences API

export type UserPreferences = {
  defaultDifficulty: 'easy' | 'less_easy' | 'medium' | 'hard' | 'hardest' | 'adaptive';
  wordLengthFilter: 'short' | 'medium' | 'long' | 'all';
  allowObscureWords: boolean;
  categoryPreferences: string[] | null;
  soundEnabled: boolean;
  hapticFeedbackEnabled: boolean;
}

export type Category = {
  id: number;
  groupKey?: string;        // For simple mode
  name?: string;            // For backward compatibility / advanced mode
  displayName: string;
  description?: string | null;
  icon?: string | null;
  sortOrder?: number;
  lexdomainCount?: number;
  senseCount?: number;
  pos?: string | null;      // For advanced mode
  lexdomainId?: number;     // For advanced mode
  lexdomainName?: string;   // For advanced mode
}

export const getUserPreferences = async (userId: number): Promise<UserPreferences> => {
  console.log('API Request: GET /preferences/:userId', userId);
  const response = await api.get(`/preferences/${userId}`);
  return response.data.data;
};

export const updateUserPreferences = async (
  userId: number,
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> => {
  console.log('API Request: PUT /preferences/:userId', userId, preferences);
  const response = await api.put(`/preferences/${userId}`, preferences);
  return response.data.data;
};

export const getAvailableCategories = async (): Promise<Category[]> => {
  console.log('API Request: GET /preferences/categories');
  const response = await api.get('/preferences/categories?mode=simple');
  // New API returns { mode, categories } wrapper
  return response.data.data.categories;
};

// Game History API

export const getGameHistory = async (
  userId?: number,
  page: number = 1,
  limit: number = 10
): Promise<GameHistoryResponse> => {
  console.log('API Request: GET /history/detailed', { userId, page, limit });
  const params: any = { page, limit };
  if (userId) {
    params.userId = userId;
  }
  const response = await api.get('/history/detailed', { params });
  return response.data.data;
};

// Word Lookup API

export interface WordLookupResponse {
  word: string;
  definitions: Array<{
    id: number;
    definition: string;
    example?: string;
    lexdomainName?: string;
    pos: string;
    posName: string;
  }>;
  difficulty?: string;
  examples?: string[];
  pronunciation?: {
    ipa: string;
    syllables: string[];
    syllableCount: number;
    formattedSyllables: string;
  };
  userHistory?: {
    timesEncountered: number;
    timesCorrect: number;
    lastSeen?: Date;
  };
}

export const lookupWord = async (
  word: string,
  userId?: number
): Promise<WordLookupResponse> => {
  console.log('API Request: GET /word-lookup/:word', { word, userId });
  const params: any = {};
  if (userId) {
    params.userId = userId;
  }
  const response = await api.get(`/word-lookup/${encodeURIComponent(word)}`, { params });
  return response.data.data;
};
