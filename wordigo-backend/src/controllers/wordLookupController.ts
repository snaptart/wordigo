/**
 * Word Lookup Controller
 *
 * Handles word dictionary lookup API endpoints
 */

import { Request, Response } from 'express';
import { lookupWord } from '../services/wordLookupService';
import { ApiResponse } from '../types';

export interface WordLookupResponse {
  word: string;
  definitions: Array<{
    id: number;
    definition: string;
    example?: string;
    lexdomainName?: string;
    pos: string; // Part of speech: n (noun), v (verb), a (adjective), r (adverb), s (adjective satellite)
    posName: string; // Full name: "noun", "verb", etc.
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

/**
 * GET /api/word-lookup/:word
 * Look up a word and get its definitions, examples, and user history
 */
export async function getWordLookup(req: Request, res: Response) {
  try {
    const { word } = req.params;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

    console.log('Word lookup request:', { word, userId });

    if (!word || word.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Word parameter is required',
      });
    }

    const result = await lookupWord(word.trim().toLowerCase(), userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Word not found',
      });
    }

    const response: ApiResponse<WordLookupResponse> = {
      success: true,
      data: result,
    };

    return res.json(response);
  } catch (error: any) {
    console.error('Error looking up word:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: 'Failed to lookup word',
      details: error.message,
    });
  }
}
