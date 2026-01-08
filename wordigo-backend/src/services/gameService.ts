/**
 * Game Service
 *
 * Manages game state, history, and answer validation
 * Ported from functions.wordigo.php
 */

import { PrismaClient } from '@prisma/client';
import { GameWord, getRandomWord } from './wordService';
import { getRandomWordWithPreferences } from './wordSelectionService';
import { updateAdaptiveDifficulty, getUserPreferences } from './userPreferencesService';
import { ScoringService } from './scoringService';

const prisma = new PrismaClient();

interface CreateHistoryParams {
  correctSenseId: number;
  wrongSenseId: number; // Keep for backward compatibility
  wrongSenseIds: number[]; // Array of 3 wrong sense IDs
  defOrder: number;
  timer: number;
  userId?: number;
  sessionId: string;
}

interface AnswerResult {
  correct: boolean;
  strikes: number;
  gameOver: boolean;
}

/**
 * Create a new game history record
 * Replicates insert_history() from functions.wordigo.php:118-155
 */
export async function createHistory(params: CreateHistoryParams): Promise<number> {
  const history = await prisma.wordigo_history.create({
    data: {
      senseid: params.correctSenseId,
      senseidFalse: params.wrongSenseId,
      wrongSenseIds: params.wrongSenseIds,
      defOrder: params.defOrder,
      userID: params.userId,
      phpSessionID: params.sessionId,
      wordigoTts: params.timer,
      hpFlag: 0,
    },
  });

  return history.wordigoHistoryID;
}

/**
 * Update game history with game ID
 * Replicates update_history_game_id() from functions.wordigo.php:219-234
 */
export async function updateHistoryGameId(
  gameId: number,
  historyId: number
): Promise<void> {
  await prisma.wordigo_history.update({
    where: { wordigoHistoryID: historyId },
    data: { wordigoGameID: gameId },
  });
}

/**
 * Get number of strikes for a game
 * Replicates get_game_num_strikes() from functions.wordigo.php:205-217
 */
export async function getGameStrikes(gameId: number): Promise<number> {
  const result = await prisma.wordigo_history.aggregate({
    where: {
      wordigoGameID: gameId,
      wordigoResult: { lt: 4 }, // Less than 4 = incorrect answers
    },
    _max: {
      wordigoResult: true,
    },
  });

  return result._max.wordigoResult || 0;
}

/**
 * Validate answer and update history
 * Replicates update_history() from functions.wordigo.php:163-203
 */
export async function validateAnswer(
  historyId: number,
  gameId: number,
  selectedSenseId: number,
  correctSenseId: number,
  timeAnswerSubmitted: number
): Promise<AnswerResult> {
  // Check if answer is correct (functions.wordigo.php:177)
  const isCorrect = selectedSenseId === correctSenseId;

  // Get current strikes for the game
  const currentStrikes = await getGameStrikes(gameId);

  let wordigoResult: number;

  if (isCorrect) {
    // Correct answer (functions.wordigo.php:179)
    wordigoResult = 4;
  } else {
    // Wrong answer - increment strikes (functions.wordigo.php:184-186)
    wordigoResult = currentStrikes + 1;
  }

  // Update history record (functions.wordigo.php:190-199)
  await prisma.wordigo_history.update({
    where: { wordigoHistoryID: historyId },
    data: {
      senseidSelected: selectedSenseId,
      wordigoTas: timeAnswerSubmitted,
      wordigoResult,
    },
  });

  const strikes = isCorrect ? currentStrikes : wordigoResult;
  const gameOver = strikes >= 3;

  return {
    correct: isCorrect,
    strikes,
    gameOver,
  };
}

/**
 * Get user's game history
 * Replicates get_wordigo_history() from functions.wordigo.php:361-413
 */
export async function getGameHistory(
  userId?: number,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  // Build where clause
  const where = userId ? { userID: userId } : {};

  const history = await prisma.wordigo_history.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createTs: 'desc' },
    include: {
      correctSense: {
        include: {
          words: true,
          synsets: true,
        },
      },
      falseSense: {
        include: {
          words: true,
          synsets: true,
        },
      },
      selectedSense: {
        include: {
          words: true,
          synsets: true,
        },
      },
    },
  });

  return history.map(record => ({
    wordigoHistoryID: record.wordigoHistoryID,
    wordigoGameID: record.wordigoGameID,
    senseid: record.senseid,
    senseidFalse: record.senseidFalse,
    senseidSelected: record.senseidSelected,
    defOrder: record.defOrder,
    wordigoResult: record.wordigoResult,
    createTs: record.createTs,
    word: record.correctSense.words.lemma,
    definition: record.correctSense.synsets.definition,
    wordFalse: record.falseSense.words.lemma,
    definitionFalse: record.falseSense.synsets.definition,
  }));
}

/**
 * Get detailed game history with individual games and word-level data
 * Optimized for game history page display
 */
export async function getDetailedGameHistory(
  userId?: number,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  // Build where clause - only get completed games
  const where = userId
    ? { userID: userId, gameStatus: { in: ['completed', 'failed'] } }
    : { gameStatus: { in: ['completed', 'failed'] } };

  // Get games with pagination
  const games = await prisma.wordigo_games.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  // Get total count for pagination
  const totalGames = await prisma.wordigo_games.count({ where });

  // For each game, get all word history entries with full details
  const gamesWithHistory = await Promise.all(
    games.map(async (game) => {
      const wordHistory = await prisma.wordigo_history.findMany({
        where: { wordigoGameID: game.id },
        orderBy: { defOrder: 'asc' },
        include: {
          correctSense: {
            include: {
              words: true,
              synsets: true,
              wordigo_difficulty_calculated: {
                select: {
                  difficulty_band: true,
                  overall_difficulty_score: true,
                }
              }
            },
          },
          selectedSense: {
            include: {
              words: true,
              synsets: true,
            },
          },
        },
      });

      // For each word history, get the wrong definitions based on wrongSenseIds
      const wordsWithDetails = await Promise.all(
        wordHistory.map(async (word) => {
          const wrongSenseIds = word.wrongSenseIds as number[] || [];

          // Fetch all wrong senses with their words and definitions
          const wrongSenses = await prisma.senses.findMany({
            where: {
              senseid: { in: wrongSenseIds }
            },
            include: {
              words: true,
              synsets: true,
              wordigo_difficulty_calculated: {
                select: {
                  difficulty_band: true,
                  overall_difficulty_score: true,
                }
              }
            }
          });

          // Determine selection strategy based on what data is available
          let selectionStrategy = 'unknown';
          if (word.correctSense?.wordigo_difficulty_calculated) {
            const correctBand = word.correctSense.wordigo_difficulty_calculated.difficulty_band;
            const wrongBands = wrongSenses
              .map(s => s.wordigo_difficulty_calculated?.difficulty_band)
              .filter(b => b !== null && b !== undefined);

            if (wrongBands.length > 0) {
              const avgWrongBand = wrongBands.reduce((sum, b) => sum + (b || 0), 0) / wrongBands.length;
              if (Math.abs((correctBand || 0) - avgWrongBand) <= 1) {
                selectionStrategy = 'difficulty_matched';
              } else {
                selectionStrategy = 'random';
              }
            }
          }

          return {
            historyId: word.wordigoHistoryID,
            defOrder: word.defOrder,
            correctWord: {
              senseid: word.correctSense.senseid,
              word: word.correctSense.words.lemma,
              definition: word.correctSense.synsets.definition,
              difficultyBand: word.correctSense.wordigo_difficulty_calculated?.difficulty_band,
              difficultyScore: word.correctSense.wordigo_difficulty_calculated?.overall_difficulty_score,
            },
            wrongDefinitions: wrongSenses.map(sense => ({
              senseid: sense.senseid,
              word: sense.words.lemma,
              definition: sense.synsets.definition,
              difficultyBand: sense.wordigo_difficulty_calculated?.difficulty_band,
              difficultyScore: sense.wordigo_difficulty_calculated?.overall_difficulty_score,
            })),
            userSelection: word.senseidSelected ? {
              senseid: word.senseidSelected,
              word: word.selectedSense?.words.lemma || 'Unknown',
              definition: word.selectedSense?.synsets.definition || 'Unknown',
            } : null,
            isCorrect: word.wordigoResult === 4,
            selectionStrategy,
            timeToAnswer: word.wordigoTas,
            createdAt: word.createTs,
          };
        })
      );

      // Calculate accuracy for this game
      const correctCount = wordsWithDetails.filter(w => w.isCorrect).length;
      const totalAttempts = wordsWithDetails.length;
      const accuracy = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;

      return {
        gameId: game.id,
        difficulty: game.difficulty,
        totalWords: game.totalWords,
        wordsCompleted: game.wordsCompleted,
        correctWords: game.correctWords,
        finalScore: game.finalScore || 0,
        timeLimit: game.timeLimit,
        timeRemaining: game.timeRemaining || 0,
        timerEnabled: game.timerEnabled,
        gameStatus: game.gameStatus,
        failReason: game.failReason,
        createdAt: game.createdAt,
        completedAt: game.completedAt,
        accuracy: Math.round(accuracy * 10) / 10,
        words: wordsWithDetails,
      };
    })
  );

  return {
    games: gamesWithHistory,
    pagination: {
      page,
      limit,
      totalGames,
      totalPages: Math.ceil(totalGames / limit),
    },
  };
}

/**
 * Get game statistics for a user
 */
export async function getGameStats(userId?: number) {
  const where = userId ? { userID: userId } : {};

  const [totalGames, correctAnswers] = await Promise.all([
    prisma.wordigo_history.count({ where }),
    prisma.wordigo_history.count({
      where: {
        ...where,
        wordigoResult: 4, // 4 = correct
      },
    }),
  ]);

  const accuracy = totalGames > 0 ? (correctAnswers / totalGames) * 100 : 0;

  // Calculate longest streak (simplified)
  const history = await prisma.wordigo_history.findMany({
    where,
    orderBy: { createTs: 'asc' },
    select: { wordigoResult: true },
  });

  let longestStreak = 0;
  let currentStreak = 0;

  for (const record of history) {
    if (record.wordigoResult === 4) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  // Calculate average speed (time to answer)
  const avgSpeed = await prisma.wordigo_history.aggregate({
    where: {
      ...where,
      wordigoTas: { not: null },
      wordigoTts: { not: null },
    },
    _avg: {
      wordigoTas: true,
    },
  });

  return {
    totalGames,
    correctAnswers,
    accuracy: Math.round(accuracy * 100) / 100,
    longestStreak,
    averageSpeed: avgSpeed._avg.wordigoTas || 0,
  };
}

/**
 * NEW GAME FORMAT FUNCTIONS
 */

interface PreloadedWord extends GameWord {
  historyId?: number; // Optional since it's set when word is displayed, not when fetched
}

interface StartGameParams {
  difficulty: string;
  userId?: number;
  sessionId: string;
  timerEnabled?: boolean;
}

interface StartGameResult {
  gameId: number;
  difficulty: string;
  totalWords: number;
  timeLimit: number;
  timerEnabled: boolean;
  words: PreloadedWord[];
}

/**
 * Start a new game with preloaded words
 */
export async function startGame(params: StartGameParams): Promise<StartGameResult> {
  // Get difficulty preset
  const preset = await prisma.game_difficulty_presets.findUnique({
    where: { name: params.difficulty },
  });

  if (!preset) {
    throw new Error(`Invalid difficulty: ${params.difficulty}`);
  }

  // Default to timer enabled if not specified
  const timerEnabled = params.timerEnabled !== undefined ? params.timerEnabled : true;

  // Verify user exists if userId is provided
  if (params.userId) {
    const userExists = await prisma.users.findUnique({
      where: { id: params.userId },
      select: { id: true }
    });

    if (!userExists) {
      console.warn(`User ID ${params.userId} not found, creating game without user association`);
      params.userId = undefined; // Clear userId to allow game creation
    }
  }

  // Create game record
  const game = await prisma.wordigo_games.create({
    data: {
      userID: params.userId,
      phpSessionID: params.sessionId,
      difficulty: params.difficulty,
      totalWords: preset.wordCount,
      timeLimit: preset.timeLimit,
      timerEnabled,
      wordsCompleted: 0,
      correctWords: 0,
      gameStatus: 'in_progress',
    },
  });

  // Preload all words for the game
  const words: PreloadedWord[] = [];

  console.log(`[GameService] Starting game for user ${params.userId || 'anonymous'}`);
  console.log(`[GameService] Difficulty preset: ${params.difficulty}`);
  console.log(`[GameService] Word count: ${preset.wordCount}`);

  for (let i = 0; i < preset.wordCount; i++) {
    console.log(`\n[GameService] ===== Loading word ${i + 1}/${preset.wordCount} =====`);

    // Get random word with user preferences if userId is provided
    const gameWord = params.userId
      ? await getRandomWordWithPreferences({
          userId: params.userId
          // Let user preferences determine difficulty (including adaptive if set)
        })
      : await getRandomWord(preset.difficultyBand || undefined);

    console.log(`[GameService] Correct word: ${gameWord.correctWord.word} (Band: ${gameWord.correctWord.difficulty_band})`);
    console.log(`[GameService] Wrong words:`, gameWord.wrongWords.map(w => `${w.word} (Band: ${w.difficulty_band})`));

    // Note: History record will be created when word is displayed to user
    // No longer pre-creating history records for unplayed words
    words.push({
      ...gameWord,
      historyId: undefined, // Will be set when word is displayed
    });
  }

  return {
    gameId: game.id,
    difficulty: params.difficulty,
    totalWords: preset.wordCount,
    timeLimit: preset.timeLimit,
    timerEnabled,
    words,
  };
}

interface CreateWordHistoryParams {
  gameId: number;
  correctSenseId: number;
  wrongSenseIds: number[];
  defOrder: number;
  timeLimit: number;
}

interface CreateWordHistoryResult {
  historyId: number;
}

/**
 * Create history record when word is displayed to user
 */
export async function createWordHistory(params: CreateWordHistoryParams): Promise<CreateWordHistoryResult> {
  const { gameId, correctSenseId, wrongSenseIds, defOrder, timeLimit } = params;

  // Get game to retrieve userId and sessionId
  const game = await prisma.wordigo_games.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    throw new Error('Game not found');
  }

  // Create history record
  const history = await prisma.wordigo_history.create({
    data: {
      wordigoGameID: gameId,
      senseid: correctSenseId,
      senseidFalse: wrongSenseIds[0], // Keep for backward compatibility
      wrongSenseIds: wrongSenseIds,
      defOrder: defOrder,
      userID: game.userID,
      phpSessionID: game.phpSessionID,
      wordigoTts: timeLimit,
      hpFlag: 0,
    },
  });

  return {
    historyId: history.wordigoHistoryID,
  };
}

interface SubmitWordAnswerParams {
  gameId: number;
  historyId: number;
  selectedSenseId: number;
  correctSenseId: number;
  hintsUsed?: number;    // Number of winnow clicks used (default: 0)
  divulged?: boolean;    // Whether divulge was clicked (default: false)
}

interface SubmitWordAnswerResult {
  correct: boolean;
  strikes: number;
  gameOver: boolean;
  reason?: 'strikes' | 'timeout';
  pointsEarned: number;       // Points earned for this word
  hintsRemaining: number;     // Updated hint count after this answer
  sessionScore: number;       // Running total score for the game
}

/**
 * Submit answer for a single word in the new game format
 */
export async function submitWordAnswer(params: SubmitWordAnswerParams): Promise<SubmitWordAnswerResult> {
  const { gameId, historyId, selectedSenseId, correctSenseId, hintsUsed = 0, divulged = false } = params;

  // Check if answer is correct
  const isCorrect = selectedSenseId === correctSenseId;

  // Get current game state
  const game = await prisma.wordigo_games.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    throw new Error('Game not found');
  }

  // Determine if this is a guest user
  const isGuest = !game.userID;

  // Get current strikes (count incorrect answers)
  const incorrectAnswers = await prisma.wordigo_history.count({
    where: {
      wordigoGameID: gameId,
      wordigoResult: {
        not: 4,
        gte: 1,
      },
    },
  });

  const currentStrikes = incorrectAnswers;
  let wordigoResult: number;

  if (isCorrect) {
    wordigoResult = 4; // Correct
  } else {
    wordigoResult = currentStrikes + 1; // Increment strike number
  }

  // Get the history record to calculate scoring and time spent
  const historyRecord = await prisma.wordigo_history.findUnique({
    where: { wordigoHistoryID: historyId },
    include: {
      correctSense: {
        include: {
          wordigo_difficulty_calculated: true,
          words: true  // Include word data to get word length
        }
      }
    }
  });

  // Calculate points for this word (only if correct)
  let pointsEarned = 0;
  if (isCorrect) {
    // Get word length category
    const wordText = historyRecord?.correctSense?.words?.lemma || '';
    const wordLengthCategory = ScoringService.getWordLengthCategory(wordText.length);

    // Get difficulty level
    let difficulty = 3; // Default to medium
    if (!isGuest) {
      try {
        const userPreferences = await getUserPreferences(game.userID!);
        difficulty = ScoringService.getDifficultyLevel(userPreferences);
      } catch (error) {
        console.error('Error fetching user preferences for scoring:', error);
        // Use default difficulty
      }
    }

    console.log('[SCORING] Calculation params:', {
      wordText,
      wordLength: wordText.length,
      wordLengthCategory,
      difficulty,
      hintsUsed,
      divulged,
      isGuest
    });

    // Calculate points using scoring service
    pointsEarned = ScoringService.calculateWordScore({
      hintsUsed,
      difficulty,
      wordLength: wordLengthCategory,
      divulged,
      isGuest,
    });

    console.log('[SCORING] Points earned:', pointsEarned);
  }

  // Update history record with answer and scoring data
  await prisma.wordigo_history.update({
    where: { wordigoHistoryID: historyId },
    data: {
      senseidSelected: selectedSenseId,
      wordigoResult,
      hints_used: hintsUsed,
      points_earned: pointsEarned,
      divulged: divulged,
    },
  });

  // Update game stats
  const newWordsCompleted = game.wordsCompleted + 1;
  const newCorrectWords = isCorrect ? game.correctWords + 1 : game.correctWords;
  const newStrikes = isCorrect ? currentStrikes : wordigoResult;

  // Update session score
  const newSessionScore = (game.session_score || 0) + pointsEarned;

  console.log('[SCORING] Session score update:', {
    oldScore: game.session_score || 0,
    pointsEarned,
    newSessionScore
  });

  // Update hints remaining (logged-in users only)
  // +1 hint for correct answer (max 3), no change for incorrect/guest
  let newHintsRemaining = game.hints_remaining || 0;
  if (isCorrect && !isGuest) {
    newHintsRemaining = Math.min(newHintsRemaining + 1, 3);
  }

  console.log('[SCORING] Hints update:', {
    oldHints: game.hints_remaining || 0,
    newHintsRemaining,
    isCorrect,
    isGuest
  });

  await prisma.wordigo_games.update({
    where: { id: gameId },
    data: {
      wordsCompleted: newWordsCompleted,
      correctWords: newCorrectWords,
      session_score: newSessionScore,
      hints_remaining: newHintsRemaining,
    },
  });

  // Update adaptive difficulty if user is logged in
  if (game.userID && historyRecord?.correctSense?.wordigo_difficulty_calculated?.difficulty_band) {
    const timeSpent = historyRecord.wordigoTts || 30; // Default to 30 seconds
    const currentBand = historyRecord.correctSense.wordigo_difficulty_calculated.difficulty_band;

    try {
      await updateAdaptiveDifficulty(game.userID, isCorrect, timeSpent, currentBand);
    } catch (error) {
      console.error('Error updating adaptive difficulty:', error);
      // Don't fail the request if adaptive difficulty update fails
    }
  }

  // Check if game is over due to strikes
  const gameOver = newStrikes >= 3;

  if (gameOver) {
    await prisma.wordigo_games.update({
      where: { id: gameId },
      data: {
        gameStatus: 'failed',
        failReason: 'strikes',
        completedAt: new Date(),
      },
    });
  }

  return {
    correct: isCorrect,
    strikes: newStrikes,
    gameOver,
    reason: gameOver ? 'strikes' : undefined,
    pointsEarned,
    hintsRemaining: newHintsRemaining,
    sessionScore: newSessionScore,
  };
}

interface CompleteGameParams {
  gameId: number;
  timeRemaining: number;
  reason?: 'completed' | 'timeout' | 'strikes';
}

interface CompleteGameResult {
  finalScore: number;
  sessionScore: number;          // Session score (same as finalScore with new system)
  correctWords: number;
  totalWords: number;
  timeBonus: number;             // Deprecated: kept for backward compatibility
  wordPoints: number;            // Deprecated: kept for backward compatibility
  totalPointsAllTime?: number;   // Only for logged-in users
}

/**
 * Complete a game and calculate final score
 * New scoring system: Uses session_score accumulated during gameplay
 * Old system (deprecated): 1 point per correct word + 1 point per second remaining
 */
export async function completeGame(params: CompleteGameParams): Promise<CompleteGameResult> {
  const { gameId, timeRemaining, reason = 'completed' } = params;

  const game = await prisma.wordigo_games.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    throw new Error('Game not found');
  }

  // Delete any unplayed word history records (where user never saw the word)
  await prisma.wordigo_history.deleteMany({
    where: {
      wordigoGameID: gameId,
      senseidSelected: null, // Word was never answered
    },
  });

  // Use session_score as the final score (new scoring system)
  const finalScore = game.session_score || 0;

  // Deprecated scoring components (kept for backward compatibility)
  const wordPoints = game.correctWords;
  const timeBonus = Math.max(0, timeRemaining);

  // Update game record
  await prisma.wordigo_games.update({
    where: { id: gameId },
    data: {
      gameStatus: reason === 'timeout' || reason === 'strikes' ? 'failed' : 'completed',
      failReason: reason === 'timeout' ? 'timeout' : reason === 'strikes' ? 'strikes' : null,
      finalScore,
      timeRemaining,
      completedAt: new Date(),
    },
  });

  // Update all-time score for logged-in users
  let totalPointsAllTime: number | undefined = undefined;
  if (game.userID) {
    await prisma.users.update({
      where: { id: game.userID },
      data: {
        total_points_all_time: {
          increment: finalScore,
        },
      },
    });

    // Fetch updated total
    const user = await prisma.users.findUnique({
      where: { id: game.userID },
      select: { total_points_all_time: true },
    });

    totalPointsAllTime = user?.total_points_all_time || 0;
  }

  return {
    finalScore,
    sessionScore: finalScore,
    correctWords: game.correctWords,
    totalWords: game.totalWords,
    timeBonus,
    wordPoints,
    totalPointsAllTime,
  };
}

/**
 * Get all difficulty presets
 */
export async function getDifficultyPresets() {
  return await prisma.game_difficulty_presets.findMany({
    where: { isActive: true },
    orderBy: { wordCount: 'asc' },
  });
}

interface FetchNextBatchParams {
  gameId: number;
  batchSize?: number;
}

interface FetchNextBatchResult {
  words: PreloadedWord[];
  totalFetched: number;
}

/**
 * Fetch next batch of words for an ongoing game (for endless mode)
 * Ensures no duplicate words within the same game session
 */
export async function fetchNextBatch(params: FetchNextBatchParams): Promise<FetchNextBatchResult> {
  const { gameId, batchSize = 20 } = params;

  // Get game details
  const game = await prisma.wordigo_games.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    throw new Error('Game not found');
  }

  // Get all sense IDs already used in this game to avoid duplicates
  const usedHistory = await prisma.wordigo_history.findMany({
    where: { wordigoGameID: gameId },
    select: { senseid: true },
  });

  const usedSenseIds = usedHistory.map(h => h.senseid);

  // Get difficulty preset to maintain consistency
  const preset = await prisma.game_difficulty_presets.findUnique({
    where: { name: game.difficulty },
  });

  if (!preset) {
    throw new Error(`Invalid difficulty: ${game.difficulty}`);
  }

  // Preload new batch of words
  const words: PreloadedWord[] = [];
  let attempts = 0;
  const maxAttempts = batchSize * 10; // Prevent infinite loop

  while (words.length < batchSize && attempts < maxAttempts) {
    attempts++;

    // Get random word with user preferences if userId is provided
    const gameWord = game.userID
      ? await getRandomWordWithPreferences({
          userId: game.userID
          // Let user preferences determine difficulty (including adaptive if set)
        })
      : await getRandomWord(preset.difficultyBand || undefined);

    // Skip if we've already used this sense in this game
    if (usedSenseIds.includes(gameWord.correctWord.senseid)) {
      continue;
    }

    // Note: History record will be created when word is displayed to user
    // No longer pre-creating history records for unplayed words
    words.push({
      ...gameWord,
      historyId: undefined, // Will be set when word is displayed
    });

    // Add to used list
    usedSenseIds.push(gameWord.correctWord.senseid);
  }

  // Update game's total words count
  await prisma.wordigo_games.update({
    where: { id: gameId },
    data: {
      totalWords: game.totalWords + words.length,
    },
  });

  return {
    words,
    totalFetched: words.length,
  };
}
