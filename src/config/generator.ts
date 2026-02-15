/**
 * Configuration for generator form inputs
 * Controls which properties are shown and which are required
 */

export const GENERATOR_CONFIG = {
  // Properties that should be shown as form inputs
  visibleProperties: [
    'story_pitch',
    'dialog_languages',
    'default_language',
    'min_lines_per_dialog',
  ] as const,

  // Properties that are required (must be filled before generation)
  requiredProperties: [
    'story_pitch',
    'dialog_languages',
    'default_language',
    'min_lines_per_dialog',
  ] as const,

  // Default values for each property
  defaults: {
    story_pitch: '',
    dialog_languages: ['English'],
    default_language: 'English',
    min_lines_per_dialog: 50,
  },

  // Property labels for display
  labels: {
    story_pitch: 'Story Pitch',
    dialog_languages: 'Languages Used (for character dialog)',
    default_language: 'default language',
    min_lines_per_dialog: 'Minimum Lines Per Dialog',
  },

  // Property descriptions for tooltips/help text
  descriptions: {
    story_pitch: 'Summary of the story\'s unique aspects',
    dialog_languages: 'Languages spoken by characters in the screenplay',
    default_language: 'Default language for all text except character dialogs',
    min_lines_per_dialog: 'Minimum number of lines per dialog (controls dialog length)',
  },

  // Property types for input rendering
  inputTypes: {
    story_pitch: 'textarea' as const,
    dialog_languages: 'checkbox-group' as const,
    default_language: 'select' as const,
    min_lines_per_dialog: 'number' as const,
  },

  // Validation rules
  validation: {
    story_pitch: {
      minLength: 10,
      maxLength: 200,
    },
    min_lines_per_dialog: {
      min: 1,
      max: 200,
    },
  },
};
