/**
 * API Routes
 */

import { Router } from 'express';
import * as wordController from '../controllers/wordController';
import * as gameController from '../controllers/gameController';
import * as userPreferencesController from '../controllers/userPreferencesController';
import * as categoryController from '../controllers/categoryController';
import * as authController from '../controllers/authController';
import * as wordLookupController from '../controllers/wordLookupController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Authentication routes (public)
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/logout', authController.logout);

// Authentication routes (protected)
router.get('/auth/me', requireAuth, authController.getCurrentUser);
router.put('/auth/update-profile', requireAuth, authController.updateProfile);
router.put('/auth/change-password', requireAuth, authController.changePassword);

// Word routes
router.get('/word', wordController.getWord);
router.get('/word-lookup/:word', wordLookupController.getWordLookup);

// Game routes (legacy format)
router.post('/game/answer', gameController.submitAnswer);
router.get('/history', gameController.getHistory);
router.get('/history/detailed', gameController.getDetailedHistory);
router.get('/stats/summary', gameController.getStats);

// New game format routes
router.get('/game/presets', gameController.getPresets);
router.post('/game/start', gameController.start);
router.post('/game/create-word-history', gameController.createHistory);
router.post('/game/submit-word', gameController.submitWord);
router.post('/game/complete', gameController.complete);
router.post('/game/fetch-next-batch', gameController.getNextBatch);

// User preferences routes
router.get('/preferences/categories', userPreferencesController.getCategories);
router.get('/preferences/:userId', userPreferencesController.getPreferences);
router.put('/preferences/:userId', userPreferencesController.updatePreferences);

// Category routes (two-tier system)
router.get('/categories', categoryController.getCategories); // ?mode=simple|advanced&counts=true
router.get('/categories/groups', categoryController.getCategoryGroups); // Simple mode groups
router.get('/categories/groups/:groupKey', categoryController.getCategoryGroup); // Specific group details
router.get('/categories/lexdomains', categoryController.getLexdomains); // Advanced mode lexdomains
router.post('/categories/expand', categoryController.expandGroupKeys); // Expand group keys to lexdomains

export default router;
