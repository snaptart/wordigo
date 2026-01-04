/**
 * Word Controller
 *
 * Handles word-related API endpoints
 */

import { Request, Response } from 'express';
import { getRandomWord } from '../services/wordService';
import { createHistory, updateHistoryGameId, getGameStrikes } from '../services/gameService';
import { ApiResponse, WordResponse } from '../types';

/**
 * GET /api/word
 * Get a random word with two definitions (one correct, one wrong)
 */
export async function getWord(req: Request, res: Response) {
  try {
    const { difficulty, gameId, sessionId } = req.query;

    // Parse difficulty (1, 2, or 3)
    const difficultyLevel = difficulty ? parseInt(difficulty as string) : undefined;

    // Get random word with definitions
    const gameWord = await getRandomWord(difficultyLevel);

    // Create history record
    const historyId = await createHistory({
      correctSenseId: gameWord.correctWord.senseid,
      wrongSenseId: gameWord.wrongWords[0].senseid, // First wrong answer for backward compatibility
      wrongSenseIds: gameWord.wrongWords.map(w => w.senseid), // All 3 wrong answers
      defOrder: gameWord.defOrder,
      timer: gameWord.timer,
      sessionId: (sessionId as string) || 'anonymous',
    });

    // Determine game ID
    let currentGameId: number;
    if (gameId) {
      currentGameId = parseInt(gameId as string);
    } else {
      // New game - use history ID as game ID
      currentGameId = historyId;
    }

    // Update history with game ID
    await updateHistoryGameId(currentGameId, historyId);

    // Get current strikes
    const strikes = await getGameStrikes(currentGameId);

    // Build response (using first wrong word for backward compatibility)
    const response: ApiResponse<WordResponse> = {
      success: true,
      data: {
        correctWord: {
          senseid: gameWord.correctWord.senseid,
          word: gameWord.correctWord.word,
          definition: gameWord.correctWord.goodDefinition,
        },
        wrongWord: {
          senseid: gameWord.wrongWords[0].senseid,
          word: gameWord.wrongWords[0].word,
          definition: gameWord.wrongWords[0].badDefinition,
        },
        historyId,
        gameId: currentGameId,
        defOrder: gameWord.defOrder,
        timer: gameWord.timer,
        strikes,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getWord:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get word',
    });
  }
}

/**
 * GET /api/landing-word
 * Get a random word for the landing page (no history tracking)
 * Returns word with 1 correct and 1 wrong definition
 */
export async function getLandingWord(_req: Request, res: Response) {
  try {
    // Get a random word with no difficulty filter
    const gameWord = await getRandomWord();

    // Build simple response - just the word data, no game tracking
    const response = {
      success: true,
      data: {
        word: gameWord.correctWord.word,
        pos: gameWord.correctWord.pos,
        posName: gameWord.correctWord.posName,
        pronunciation: gameWord.correctWord.pronunciation,
        correctDefinition: gameWord.correctWord.goodDefinition,
        wrongDefinition: gameWord.wrongWords[0].badDefinition,
        // Random order: 0 = correct first, 1 = wrong first
        defOrder: Math.floor(Math.random() * 2)
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getLandingWord:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get landing word',
    });
  }
}
