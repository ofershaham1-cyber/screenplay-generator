import { LANGUAGE_CODES, DEFAULT_LANGUAGE, validateLanguage } from './config/languages';

const synth = window.speechSynthesis;

let currentLanguageSpeeds: Record<string, number> = {};

export const convertLangToISO = (lang: string): string => LANGUAGE_CODES[lang] || 'en-US';

export const setDynamicLanguageSpeeds = (speeds: Record<string, number>): void => {
  currentLanguageSpeeds = { ...speeds };
  // Adjust currently playing utterance rate if possible
  if (synth.paused) {
    synth.resume();
  }
};

export const getDynamicLanguageSpeeds = (): Record<string, number> => currentLanguageSpeeds;

const getVoiceForLanguage = (langCode: string): SpeechSynthesisVoice | undefined => {
  const voices = synth.getVoices();
  // Try exact match first, then language code match
  let voice = voices.find(v => v.lang === langCode);
  if (!voice) {
    const langPrefix = langCode.split('-')[0];
    voice = voices.find(v => v.lang.startsWith(langPrefix));
  }
  return voice || voices[0];
};

export const speak = (text: string, lang: string = 'English', rate: number = 1, onStart?: () => void): Promise<void> => {
  return new Promise((resolve) => {
    const langCode = convertLangToISO(lang);
    const utterance = new SpeechSynthesisUtterance(text);
    console.info(`Speaking with language: ${lang} (${langCode}), rate: ${rate}`);
    utterance.lang = langCode;

    const voice = getVoiceForLanguage(langCode);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = rate;
    if (onStart) utterance.onstart = onStart;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    synth.speak(utterance);
  });
};

export const stop = (): void => {
  synth.cancel();
};

export const pause = (): void => {
  if (synth.speaking && !synth.paused) {
    synth.pause();
  }
};

export const resume = (): void => {
  if (synth.paused) {
    synth.resume();
  }
};

export const isPaused = (): boolean => synth.paused;

export const isSpeaking = (): boolean => synth.speaking;

interface PlayScreenplayOptions {
  characterMode?: boolean;
  onLineStart?: (sceneIdx: number, lineIdx: number) => void;
  languageSpeeds?: Record<string, number>;
  onWordStart?: (word: string | null, type: string, sceneIdx?: number, lineIdx?: number) => void;
  ttsOptions?: Record<string, unknown>;
  defaultLanguage?: string;
  controller?: { isCancelled?: boolean };
  defaultLanguageSpeed?: number;
  startSceneIdx?: number;
  startLineIdx?: number;
  onLanguageChange?: (lang: string) => void;
}

interface Screenplay {
  scenes?: Array<{
    scene?: string;
    dialog?: Array<{
      character?: string;
      parenthetical?: string;
      translation?: string;
      text?: string;
      language?: string;
      action?: string;
    }>;
  }>;
}

export const playScreenplay = async (screenplay: Screenplay, options: PlayScreenplayOptions = {}): Promise<void> => {
  const { 
    characterMode = true, 
    onLineStart, 
    languageSpeeds = {}, 
    onWordStart, 
    ttsOptions = {}, 
    defaultLanguage = DEFAULT_LANGUAGE, 
    controller = {}, 
    defaultLanguageSpeed = 1, 
    startSceneIdx = 0, 
    startLineIdx = 0, 
    onLanguageChange 
  } = options;
  
  currentLanguageSpeeds = { ...languageSpeeds };
  currentLanguageSpeeds[defaultLanguage] = defaultLanguageSpeed;
  const scenes = screenplay.scenes || [];

  for (let sceneIdx = startSceneIdx; sceneIdx < scenes.length; sceneIdx++) {
    if ((controller as any).isCancelled) break;
    
    const scene = scenes[sceneIdx];

    // Only speak scene description if we're starting from the beginning of the scene
    const ttsOpts = ttsOptions as any;
    if (ttsOpts.includeNarrator && scene.scene && (sceneIdx > startSceneIdx || startLineIdx === 0)) {
      if ((controller as any).isCancelled) break;
      onLanguageChange?.(defaultLanguage);
      await speakWithHighlight(scene.scene, defaultLanguage, currentLanguageSpeeds[defaultLanguage] || 1, (word) => onWordStart?.(word, 'scene', sceneIdx));
    }

    const dialog = scene.dialog || [];
    const lineStartIdx = (sceneIdx === startSceneIdx) ? startLineIdx : 0;
    
    for (let lineIdx = lineStartIdx; lineIdx < dialog.length; lineIdx++) {
      if ((controller as any).isCancelled) break;
      
      const line = dialog[lineIdx];

      // Speak character if selected
      if (ttsOpts.includeCharacter && line.character) {
        if ((controller as any).isCancelled) break;
        const charSpeed = currentLanguageSpeeds[defaultLanguage] || 1;
        onLanguageChange?.(defaultLanguage);
        await speakWithHighlight(line.character, defaultLanguage, charSpeed, (word) => onWordStart?.(word, 'character', sceneIdx, lineIdx));
      }

      // Speak parenthetical if selected
      if (ttsOpts.includeParenthetical && line.parenthetical) {
        if ((controller as any).isCancelled) break;
        const parenthSpeed = currentLanguageSpeeds[defaultLanguage] || 1;
        await speakWithHighlight(line.parenthetical, defaultLanguage, parenthSpeed, (word) => onWordStart?.(word, 'parenthetical', sceneIdx, lineIdx));
      }

      // Handle translation timing
      const shouldPlayTranslationBefore = ttsOpts.translationTiming === 'before' || ttsOpts.translationTiming === 'both';
      const shouldPlayTranslationAfter = ttsOpts.translationTiming === 'after' || ttsOpts.translationTiming === 'both';

      // Speak translation before text if selected
      if (shouldPlayTranslationBefore && ttsOpts.includeTranslation && line.translation && line.translation !== line.text) {
        if ((controller as any).isCancelled) break;
        const translationSpeed = currentLanguageSpeeds[defaultLanguage] || 1;
        await speakWithHighlight(line.translation, defaultLanguage, translationSpeed, (word) => onWordStart?.(word, 'translation', sceneIdx, lineIdx));
      }

      // Speak text if selected
      if (ttsOpts.includeText && line.text) {
        if ((controller as any).isCancelled) break;
        const textLang = characterMode && line.language ? validateLanguage(line.language) : defaultLanguage;
        const textSpeed = currentLanguageSpeeds[textLang] || 1;
        onLanguageChange?.(textLang);
        await speakWithHighlight(line.text, textLang, textSpeed, (word) => onWordStart?.(word, 'text', sceneIdx, lineIdx), () => {
          if (onLineStart && !(controller as any).isCancelled) onLineStart(sceneIdx, lineIdx);
        });
      }

      // Speak translation after text if selected
      if (shouldPlayTranslationAfter && ttsOpts.includeTranslation && line.translation && line.translation !== line.text) {
        if ((controller as any).isCancelled) break;
        const translationSpeed = currentLanguageSpeeds[defaultLanguage] || 1;
        await speakWithHighlight(line.translation, defaultLanguage, translationSpeed, (word) => onWordStart?.(word, 'translation', sceneIdx, lineIdx));
      }

      // Speak action if selected
      if (ttsOpts.includeAction && line.action) {
        if ((controller as any).isCancelled) break;
        const actionSpeed = currentLanguageSpeeds[defaultLanguage] || 1;
        await speakWithHighlight(line.action, defaultLanguage, actionSpeed, (word) => onWordStart?.(word, 'action', sceneIdx, lineIdx));
      }
    }
  }

  if (onLineStart && !(controller as any).isCancelled) onLineStart(-1, -1);
};

export const speakWithHighlight = (
  text: string,
  lang: string = 'English',
  rate: number = 1,
  onWordStart?: (word: string | null) => void,
  onStart?: () => void
): Promise<void> => {
  return new Promise((resolve) => {
    const langCode = convertLangToISO(lang);
    const utterance = new SpeechSynthesisUtterance(text);
    console.info(`Speaking with language: ${lang} (${langCode}), rate: ${rate}`);
    utterance.lang = langCode;

    const voice = getVoiceForLanguage(langCode);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = rate;
    if (onStart) utterance.onstart = onStart;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    const words = text.split(/\s+/).filter(w => w.length > 0);
    let currentWordIndex = 0;
    let startTime = 0;
    let wordDurations: number[] = [];
    let timeoutIds: NodeJS.Timeout[] = [];

    // Estimate word durations based on word length and speaking rate
    const calculateDurations = () => {
      wordDurations = [];
      const speed = currentLanguageSpeeds[lang] || rate;
      const baseDuration = 1000 / speed; // milliseconds per character approximately
      words.forEach(word => {
        const duration = Math.max(word.length * baseDuration * 0.1, baseDuration * 0.3);
        wordDurations.push(duration);
      });
    };

    calculateDurations();

    const totalDuration = wordDurations.reduce((sum, dur) => sum + dur, 0);
    let cumulativeTime = 0;

    utterance.onstart = () => {
      startTime = Date.now();
      if (onStart) onStart();
      
      // Start highlighting the first word
      if (words.length > 0) {
        const firstTimeout = setTimeout(() => {
          if (onWordStart) onWordStart(words[0]);
          currentWordIndex = 1;
          
          // Schedule remaining words
          for (let i = 1; i < words.length; i++) {
            cumulativeTime += wordDurations[i - 1];
            const wordTimeout = setTimeout(() => {
              if (onWordStart) onWordStart(words[i]);
            }, cumulativeTime);
            timeoutIds.push(wordTimeout);
          }
        }, wordDurations[0] * 0.5); // Start highlighting midway through first word
        timeoutIds.push(firstTimeout);
      }
    };

    const originalOnEnd = utterance.onend;
    utterance.onend = (event: Event | SpeechSynthesisEvent) => {
      // Clear any remaining timeouts
      timeoutIds.forEach(id => clearTimeout(id));
      // Clear any remaining highlights
      if (onWordStart) onWordStart(null);
      originalOnEnd?.call(utterance, event as SpeechSynthesisEvent);
      resolve();
    };

    synth.speak(utterance);
  });
};
