/**
 * Category Controller
 *
 * Handles HTTP requests for category groups and lexdomains
 */

import { Request, Response } from 'express';
import categoryGroupService from '../services/categoryGroupService';
import { CategoryMode, CategoryResponse } from '../types';

/**
 * GET /api/categories?mode=simple|advanced&counts=true|false
 * Get categories based on mode
 */
export async function getCategories(req: Request, res: Response): Promise<void> {
  try {
    const mode = (req.query.mode as CategoryMode) || 'simple';
    const includeCounts = req.query.counts === 'true';

    if (mode !== 'simple' && mode !== 'advanced') {
      res.status(400).json({
        success: false,
        error: 'Invalid mode. Must be "simple" or "advanced"'
      });
      return;
    }

    const categories = await categoryGroupService.getCategoriesByMode(mode, includeCounts);

    const response: CategoryResponse = {
      mode,
      categories
    };

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve categories'
    });
  }
}

/**
 * GET /api/categories/groups
 * Get all category groups (Simple Mode)
 */
export async function getCategoryGroups(req: Request, res: Response): Promise<void> {
  try {
    const includeCounts = req.query.counts === 'true';
    const groups = await categoryGroupService.getCategoryGroups(includeCounts);

    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    console.error('Error getting category groups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve category groups'
    });
  }
}

/**
 * GET /api/categories/groups/:groupKey
 * Get a specific category group with its lexdomains
 */
export async function getCategoryGroup(req: Request, res: Response): Promise<void> {
  try {
    const { groupKey } = req.params;
    const group = await categoryGroupService.getCategoryGroupByKey(groupKey);

    if (!group) {
      res.status(404).json({
        success: false,
        error: 'Category group not found'
      });
      return;
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Error getting category group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve category group'
    });
  }
}

/**
 * GET /api/categories/lexdomains
 * Get all lexdomains (Advanced Mode)
 */
export async function getLexdomains(req: Request, res: Response): Promise<void> {
  try {
    const includeCounts = req.query.counts === 'true';
    const lexdomains = await categoryGroupService.getAdvancedModeCategories(includeCounts);

    res.json({
      success: true,
      data: lexdomains
    });
  } catch (error) {
    console.error('Error getting lexdomains:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve lexdomains'
    });
  }
}

/**
 * POST /api/categories/expand
 * Expand category group keys to lexdomain names
 * Body: { groupKeys: string[] }
 */
export async function expandGroupKeys(req: Request, res: Response): Promise<void> {
  try {
    const { groupKeys } = req.body;

    if (!Array.isArray(groupKeys)) {
      res.status(400).json({
        success: false,
        error: 'groupKeys must be an array'
      });
      return;
    }

    const lexdomainNames = await categoryGroupService.expandGroupKeysToLexdomainNames(groupKeys);

    res.json({
      success: true,
      data: {
        groupKeys,
        lexdomainNames
      }
    });
  } catch (error) {
    console.error('Error expanding group keys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to expand group keys'
    });
  }
}

export default {
  getCategories,
  getCategoryGroups,
  getCategoryGroup,
  getLexdomains,
  expandGroupKeys
};
