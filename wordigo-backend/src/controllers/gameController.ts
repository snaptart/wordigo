/**
 * Game Controller
 *
 * Handles game-related API endpoints
 */

import { Request, Response } from 'express';
import {
  validateAnswer,
  getGameHistory,
  getGameStats,
  startGame,
  submitWordAnswer,
  completeGame,
  getDifficultyPresets,
  fetchNextBatch
} from '../services/gameService';
import { ApiResponse, AnswerResponse } from '../types';

/**
 * POST /api/game/answer
 * Submit an answer and get validation result
 */
export async function submitAnswer(req: Request, res: Response) {
  try {
    const { historyId, gameId, selectedSenseId, timeRemaining, correctSenseId } = req.body;

    // Validate required fields
    if (!historyId || !gameId || selectedSenseId === undefined || !correctSenseId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Calculate time answer submitted (timer value when submitted)
    const timeAnswerSubmitted = timeRemaining || 0;

    // Validate answer
    const result = await validateAnswer(
      historyId,
      gameId,
      selectedSenseId,
      correctSenseId,
      timeAnswerSubmitted
    );

    const response: ApiResponse<AnswerResponse> = {
      success: true,
      data: result,
    };

    res.json(response);
  } catch (error) {
    console.error('Error in submitAnswer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit answer',
    });
  }
}

/**
 * GET /api/history
 * Get user's game history
 */
export async function getHistory(req: Request, res: Response) {
  try {
    const { page = '1', limit = '20', userId } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const userIdNum = userId ? parseInt(userId as string) : undefined;

    const history = await getGameHistory(userIdNum, pageNum, limitNum);

    res.json({
      success: true,
      data: {
        games: history,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error('Error in getHistory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get history',
    });
  }
}

/**
 * GET /api/stats/summary
 * Get user's game statistics
 */
export async function getStats(req: Request, res: Response) {
  try {
    const { userId } = req.query;
    const userIdNum = userId ? parseInt(userId as string) : undefined;

    const stats = await getGameStats(userIdNum);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error in getStats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
    });
  }
}

/**
 * NEW GAME FORMAT ENDPOINTS
 */

/**
 * GET /api/game/presets
 * Get available difficulty presets
 */
export async function getPresets(req: Request, res: Response) {
  try {
    const presets = await getDifficultyPresets();

    res.json({
      success: true,
      data: presets,
    });
  } catch (error) {
    console.error('Error in getPresets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get difficulty presets',
    });
  }
}

/**
 * POST /api/game/start
 * Start a new game with preloaded words
 */
export async function start(req: Request, res: Response) {
  try {
    const { difficulty, userId, sessionId, timerEnabled } = req.body;

    // Validate required fields
    if (!difficulty || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: difficulty and sessionId',
      });
    }

    // Start game
    const gameData = await startGame({
      difficulty,
      userId,
      sessionId,
      timerEnabled,
    });

    res.json({
      success: true,
      data: gameData,
    });
  } catch (error) {
    console.error('Error in start:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start game',
    });
  }
}

/**
 * POST /api/game/submit-word
 * Submit answer for a single word in the new game format
 */
export async function submitWord(req: Request, res: Response) {
  try {
    const { gameId, historyId, selectedSenseId, correctSenseId } = req.body;

    // Validate required fields
    if (!gameId || !historyId || selectedSenseId === undefined || !correctSenseId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Submit answer
    const result = await submitWordAnswer({
      gameId,
      historyId,
      selectedSenseId,
      correctSenseId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in submitWord:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit answer',
    });
  }
}

/**
 * POST /api/game/complete
 * Complete a game and get final score
 */
export async function complete(req: Request, res: Response) {
  try {
    const { gameId, timeRemaining, reason } = req.body;

    // Validate required fields
    if (!gameId || timeRemaining === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: gameId and timeRemaining',
      });
    }

    // Complete game
    const result = await completeGame({
      gameId,
      timeRemaining,
      reason,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in complete:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete game',
    });
  }
}

/**
 * POST /api/game/fetch-next-batch
 * Fetch next batch of words for an ongoing game (endless mode)
 */
export async function getNextBatch(req: Request, res: Response) {
  try {
    const { gameId, batchSize } = req.body;

    // Validate required fields
    if (!gameId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: gameId',
      });
    }

    // Fetch next batch
    const result = await fetchNextBatch({
      gameId,
      batchSize,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in getNextBatch:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch next batch',
    });
  }
}
