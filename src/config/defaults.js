/**
 * Centralized application configuration
 * Default values and constants used across the application
 */

// Default AI Model
export const DEFAULT_MODEL = 'allenai/olmo-3.1-32b-think:free';

// TTS Options Defaults
export const DEFAULT_TTS_OPTIONS = {
  includeNarrator: true,
  includeCharacter: true,
  includeText: true,
  includeTranslation: true,
  includeAction: true,
  includeParenthetical: false,
  translationTiming: 'both' // 'before', 'after', 'both'
};

// Playback Defaults
export const DEFAULT_LANGUAGE_SPEED = 1;
export const DEFAULT_SPEED_RANGE = {
  min: 0.5,
  max: 2,
  step: 0.1
};

// Generator Form Defaults
export const DEFAULT_STORY_PITCH = 'Create a conversation between an adult and a child playing a guessing game';

// UI Defaults
export const DEFAULT_THEME = 'light';
export const DEFAULT_DESIGN = 'standard';

// Response Defaults
export const DEFAULT_RESPONSE_DELAY = 0; // milliseconds
