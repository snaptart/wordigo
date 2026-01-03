/**
 * Shared TypeScript types for backend
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

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

export interface AnswerRequest {
  historyId: number;
  gameId: number;
  selectedSenseId: number;
  timeRemaining: number;
  sessionId: string;
}

export interface AnswerResponse {
  correct: boolean;
  strikes: number;
  gameOver: boolean;
}

// User Preferences Types

export type DifficultyLevel = 'easy' | 'less_easy' | 'medium' | 'hard' | 'hardest' | 'adaptive';
export type WordLengthFilter = 'short' | 'medium' | 'long' | 'all';
export type CategoryMode = 'simple' | 'advanced';

export interface UserPreferences {
  id: number;
  userId: number;

  // Difficulty Preferences
  defaultDifficulty: DifficultyLevel;
  wordLengthFilter: WordLengthFilter;
  allowObscureWords: boolean;

  // Category Preferences
  categoryPreferences?: string[] | null;
  categoryMode?: CategoryMode; // New: simple or advanced mode

  // User Interface Preferences
  soundEnabled: boolean;
  hapticFeedbackEnabled: boolean;

  // Adaptive Difficulty Settings
  adaptiveDifficultyData?: AdaptiveDifficultyData | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface AdaptiveDifficultyData {
  currentBand: number; // 1-5
  performanceHistory: PerformanceRecord[];
  adjustmentTimestamp: Date;
}

export interface PerformanceRecord {
  difficultyBand: number;
  correctCount: number;
  totalCount: number;
  averageTime: number; // seconds
  timestamp: Date;
}

export interface UpdatePreferencesRequest {
  defaultDifficulty?: DifficultyLevel;
  wordLengthFilter?: WordLengthFilter;
  allowObscureWords?: boolean;
  categoryPreferences?: string[];
  categoryMode?: CategoryMode;
  soundEnabled?: boolean;
  hapticFeedbackEnabled?: boolean;
}

export interface WordSelectionOptions {
  userId?: number;
  difficultyBand?: number; // 1-5 for explicit difficulty
  wordLengthFilter?: WordLengthFilter;
  allowObscureWords?: boolean;
  categoryPreferences?: string[];
  categoryMode?: CategoryMode;
  useAdaptiveDifficulty?: boolean;
}

// Category Group Types

export interface CategoryGroup {
  id: number;
  groupKey: string;
  displayName: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  lexdomainCount: number;
  senseCount?: number;
}

export interface CategoryGroupWithDomains extends CategoryGroup {
  lexdomains: Array<{
    lexdomainId: number;
    lexdomainName: string;
  }>;
}

export interface LexdomainCategory {
  lexdomainId: number;
  lexdomainName: string;
  displayName: string;
  pos: string | null;
  senseCount?: number;
}

export interface CategoryResponse {
  mode: CategoryMode;
  categories: CategoryGroup[] | LexdomainCategory[];
}

// Authentication Types

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  name?: string | null;
  profilePicture?: string | null;
  emailVerified: boolean;
  createdAt: Date;
}

export interface JWTPayload {
  userId: number;
  email: string;
  username: string;
  type: 'access' | 'refresh';
}

export interface GoogleOAuthProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
