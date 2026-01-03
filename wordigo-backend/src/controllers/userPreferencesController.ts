/**
 * User Preferences Controller
 *
 * HTTP handlers for user preferences endpoints
 */

import { Request, Response } from 'express';
import {
  getUserPreferences,
  updateUserPreferences,
  getAvailableCategories
} from '../services/userPreferencesService';
import categoryGroupService from '../services/categoryGroupService';
import { ApiResponse, UpdatePreferencesRequest, CategoryMode } from '../types';

/**
 * GET /api/preferences/:userId
 * Get user preferences
 */
export async function getPreferences(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      } as ApiResponse<null>);
    }

    const preferences = await getUserPreferences(userId);

    return res.json({
      success: true,
      data: preferences
    } as ApiResponse<typeof preferences>);

  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user preferences'
    } as ApiResponse<null>);
  }
}

/**
 * PUT /api/preferences/:userId
 * Update user preferences
 */
export async function updatePreferences(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      } as ApiResponse<null>);
    }

    const updates: UpdatePreferencesRequest = req.body;

    // Validate updates
    const validationError = validatePreferencesUpdate(updates);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError
      } as ApiResponse<null>);
    }

    const preferences = await updateUserPreferences(userId, updates);

    return res.json({
      success: true,
      data: preferences
    } as ApiResponse<typeof preferences>);

  } catch (error) {
    console.error('Error updating user preferences:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update user preferences'
    } as ApiResponse<null>);
  }
}

/**
 * GET /api/preferences/categories?mode=simple|advanced
 * Get available categories for filtering
 * DEPRECATED: Use /api/categories instead
 */
export async function getCategories(req: Request, res: Response) {
  try {
    const mode = (req.query.mode as CategoryMode) || 'simple';

    if (mode !== 'simple' && mode !== 'advanced') {
      return res.status(400).json({
        success: false,
        error: 'Invalid mode. Must be "simple" or "advanced"'
      } as ApiResponse<null>);
    }

    // Use new category system
    const categories = await categoryGroupService.getCategoriesByMode(mode, false);

    return res.json({
      success: true,
      data: {
        mode,
        categories
      }
    } as ApiResponse<{ mode: CategoryMode; categories: typeof categories }>);

  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    } as ApiResponse<null>);
  }
}

/**
 * Validate preferences update request
 */
function validatePreferencesUpdate(updates: UpdatePreferencesRequest): string | null {
  const validDifficulties = ['easy', 'less_easy', 'medium', 'hard', 'hardest', 'adaptive'];
  const validWordLengths = ['short', 'medium', 'long', 'all'];
  const validCategoryModes = ['simple', 'advanced'];

  if (updates.defaultDifficulty && !validDifficulties.includes(updates.defaultDifficulty)) {
    return `Invalid difficulty level. Must be one of: ${validDifficulties.join(', ')}`;
  }

  if (updates.wordLengthFilter && !validWordLengths.includes(updates.wordLengthFilter)) {
    return `Invalid word length filter. Must be one of: ${validWordLengths.join(', ')}`;
  }

  if (updates.allowObscureWords !== undefined && typeof updates.allowObscureWords !== 'boolean') {
    return 'allowObscureWords must be a boolean';
  }

  if (updates.soundEnabled !== undefined && typeof updates.soundEnabled !== 'boolean') {
    return 'soundEnabled must be a boolean';
  }

  if (updates.hapticFeedbackEnabled !== undefined && typeof updates.hapticFeedbackEnabled !== 'boolean') {
    return 'hapticFeedbackEnabled must be a boolean';
  }

  if (updates.categoryMode && !validCategoryModes.includes(updates.categoryMode)) {
    return `Invalid category mode. Must be one of: ${validCategoryModes.join(', ')}`;
  }

  if (updates.categoryPreferences !== undefined && updates.categoryPreferences !== null) {
    if (!Array.isArray(updates.categoryPreferences)) {
      return 'categoryPreferences must be an array or null';
    }
    if (!updates.categoryPreferences.every(cat => typeof cat === 'string')) {
      return 'All category preferences must be strings';
    }
  }

  return null;
}

export default {
  getPreferences,
  updatePreferences,
  getCategories
};
