/**
 * Centralized language configuration
 * Used across the application for consistency
 */

export const LANGUAGES = [
  'English',
  'Hebrew',
  'Spanish',
  'French',
  'Russian',
  'Chinese',
  'Japanese',
  'Arabic',
  'German',
  'Italian',
  'Portuguese',
  'Korean',
  'Dutch',
  'Polish',
  'Turkish',
  'Hindi'
];

export const DEFAULT_LANGUAGE = 'Hebrew';

export const DEFAULT_DIALOG_LANGUAGES = ['Arabic', 'Hebrew'];

export const DEFAULT_FALLBACK_DIALOG_LANGUAGES = ['English', 'Spanish'];

export const RTL_LANGUAGES = [
  'Arabic',
  'Hebrew',
  'Urdu',
  'Persian',
  'Farsi',
  'Pashto',
  'Kurdish'
];

export const LANGUAGE_COLORS = {
  'English': '#8b5cf6', // purple
  'Hebrew': '#3b82f6',  // blue
  'Spanish': '#10b981', // emerald
  'French': '#f59e0b',  // amber
  'Russian': '#ef4444', // red
  'Chinese': '#ec4899', // pink
  'Japanese': '#06b6d4', // cyan
  'Arabic': '#84cc16',  // lime
  'German': '#f97316',  // orange
  'Italian': '#6366f1', // indigo
  'Portuguese': '#14b8a6', // teal
  'Korean': '#8b5a2b', // brown
  'Dutch': '#64748b',   // slate
  'Polish': '#7c3aed',  // violet
  'Turkish': '#dc2626', // rose
  'Hindi': '#059669'    // green
};

export const LANGUAGE_CODES = {
  'English': 'en-US',
  'Hebrew': 'he-IL',
  'Spanish': 'es-ES',
  'French': 'fr-FR',
  'Russian': 'ru-RU',
  'Chinese': 'zh-CN',
  'Japanese': 'ja-JP',
  'Arabic': 'ar-SA',
  'German': 'de-DE',
  'Italian': 'it-IT',
  'Portuguese': 'pt-PT',
  'Korean': 'ko-KR',
  'Dutch': 'nl-NL',
  'Polish': 'pl-PL',
  'Turkish': 'tr-TR',
  'Hindi': 'hi-IN'
};

export const isLanguageRTL = (lang) => RTL_LANGUAGES.includes(lang);

export const getLanguageColor = (lang) => LANGUAGE_COLORS[lang] || '#6b7280';

export const getLanguageCode = (lang) => LANGUAGE_CODES[lang] || 'en-US';
