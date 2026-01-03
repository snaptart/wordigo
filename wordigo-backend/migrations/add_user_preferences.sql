-- Migration: Add User Preferences Table
-- This migration adds support for user preferences including difficulty settings,
-- word filters, and UI preferences

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,

    -- Difficulty Preferences
    default_difficulty VARCHAR(20) NOT NULL DEFAULT 'adaptive',
    word_length_filter VARCHAR(20) NOT NULL DEFAULT 'all',
    allow_obscure_words BOOLEAN NOT NULL DEFAULT true,

    -- Category Preferences (stored as JSON array)
    category_preferences JSONB,

    -- User Interface Preferences
    sound_enabled BOOLEAN NOT NULL DEFAULT true,
    haptic_feedback_enabled BOOLEAN NOT NULL DEFAULT true,

    -- Adaptive Difficulty Settings
    adaptive_difficulty_data JSONB,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Foreign key constraint
    CONSTRAINT fk_user_preferences_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Add check constraints for valid enum values
ALTER TABLE user_preferences
    ADD CONSTRAINT chk_default_difficulty
    CHECK (default_difficulty IN ('easy', 'less_easy', 'medium', 'hard', 'hardest', 'adaptive'));

ALTER TABLE user_preferences
    ADD CONSTRAINT chk_word_length_filter
    CHECK (word_length_filter IN ('short', 'medium', 'long', 'all'));

-- Insert comment on table
COMMENT ON TABLE user_preferences IS 'Stores user preferences for game difficulty, word filters, and UI settings';
COMMENT ON COLUMN user_preferences.default_difficulty IS 'Default difficulty level: easy, less_easy, medium, hard, hardest, or adaptive';
COMMENT ON COLUMN user_preferences.word_length_filter IS 'Filter words by length: short (≤6), medium (7-12), long (≥13), or all';
COMMENT ON COLUMN user_preferences.allow_obscure_words IS 'Whether to include archaic/rare vocabulary';
COMMENT ON COLUMN user_preferences.category_preferences IS 'JSON array of preferred lexical domain categories';
COMMENT ON COLUMN user_preferences.adaptive_difficulty_data IS 'JSON object storing performance history for adaptive difficulty';
