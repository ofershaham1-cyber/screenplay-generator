const synth = window.speechSynthesis;

let currentLanguageSpeeds = {};

const langToISO = {
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

export const convertLangToISO = (lang) => langToISO[lang] || 'en-US';

export const setDynamicLanguageSpeeds = (speeds) => {
  currentLanguageSpeeds = { ...speeds };
  // Adjust currently playing utterance rate if possible
  if (synth.paused) {
    synth.resume();
  }
};

export const getDynamicLanguageSpeeds = () => currentLanguageSpeeds;

const getVoiceForLanguage = (langCode) => {
  const voices = synth.getVoices();
  // Try exact match first, then language code match
  let voice = voices.find(v => v.lang === langCode);
  if (!voice) {
    const langPrefix = langCode.split('-')[0];
    voice = voices.find(v => v.lang.startsWith(langPrefix));
  }
  return voice || voices[0];
};

export const speak = (text, lang = 'English', rate = 1, onStart) => {
  return new Promise((resolve) => {
    const langCode = convertLangToISO(lang);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;

    const voice = getVoiceForLanguage(langCode);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = rate;
    if (onStart) utterance.onstart = onStart;
    utterance.onend = resolve;
    utterance.onerror = resolve;
    synth.speak(utterance);
  });
};

export const stop = () => {
  synth.cancel();
};

export const pause = () => {
  if (synth.speaking && !synth.paused) {
    synth.pause();
  }
};

export const resume = () => {
  if (synth.paused) {
    synth.resume();
  }
};

export const isPaused = () => synth.paused;

export const isSpeaking = () => synth.speaking;

export const playScreenplay = async (screenplay, options = {}) => {
  const { characterMode = true, onLineStart, languageSpeeds = {}, onWordStart, ttsOptions = {}, defaultLanguage = 'Hebrew', controller = {}, defaultLanguageSpeed = 1 } = options;
  currentLanguageSpeeds = { ...languageSpeeds };
  currentLanguageSpeeds[defaultLanguage] = defaultLanguageSpeed;
  const scenes = screenplay.scenes || [];

  for (let sceneIdx = 0; sceneIdx < scenes.length; sceneIdx++) {
    if (controller.isCancelled) break;
    
    const scene = scenes[sceneIdx];

    if (ttsOptions.includeNarrator && scene.scene) {
      if (controller.isCancelled) break;
      await speakWithHighlight(scene.scene, 'English', currentLanguageSpeeds['English'] || 1, (word) => onWordStart?.(word, 'scene', sceneIdx));
    }

    const dialog = scene.dialog || [];
    for (let lineIdx = 0; lineIdx < dialog.length; lineIdx++) {
      if (controller.isCancelled) break;
      
      const line = dialog[lineIdx];

      // Speak character if selected
      if (ttsOptions.includeCharacter && line.character) {
        if (controller.isCancelled) break;
        const charSpeed = currentLanguageSpeeds[defaultLanguage] || 1;
        await speakWithHighlight(line.character, defaultLanguage, charSpeed, (word) => onWordStart?.(word, 'character', sceneIdx, lineIdx));
      }

      // Speak parenthetical if selected
      if (ttsOptions.includeParenthetical && line.parenthetical) {
        if (controller.isCancelled) break;
        const parenthSpeed = currentLanguageSpeeds[defaultLanguage] || 1;
        await speakWithHighlight(line.parenthetical, defaultLanguage, parenthSpeed, (word) => onWordStart?.(word, 'parenthetical', sceneIdx, lineIdx));
      }

      // Handle translation timing
      const shouldPlayTranslationBefore = ttsOptions.translationTiming === 'before' || ttsOptions.translationTiming === 'both';
      const shouldPlayTranslationAfter = ttsOptions.translationTiming === 'after' || ttsOptions.translationTiming === 'both';

      // Speak translation before text if selected
      if (shouldPlayTranslationBefore && ttsOptions.includeTranslation && line.translation) {
        if (controller.isCancelled) break;
        const translationSpeed = currentLanguageSpeeds[defaultLanguage] || 1;
        await speakWithHighlight(line.translation, defaultLanguage, translationSpeed, (word) => onWordStart?.(word, 'translation', sceneIdx, lineIdx));
      }

      // Speak text if selected
      if (ttsOptions.includeText && line.text) {
        if (controller.isCancelled) break;
        const textLang = characterMode && line.language ? line.language : 'English';
        const textSpeed = currentLanguageSpeeds[textLang] || 1;
        await speakWithHighlight(line.text, textLang, textSpeed, (word) => onWordStart?.(word, 'text', sceneIdx, lineIdx), () => {
          if (onLineStart && !controller.isCancelled) onLineStart(sceneIdx, lineIdx);
        });
      }

      // Speak translation after text if selected
      if (shouldPlayTranslationAfter && ttsOptions.includeTranslation && line.translation) {
        if (controller.isCancelled) break;
        const translationSpeed = currentLanguageSpeeds[defaultLanguage] || 1;
        await speakWithHighlight(line.translation, defaultLanguage, translationSpeed, (word) => onWordStart?.(word, 'translation', sceneIdx, lineIdx));
      }

      // Speak action if selected
      if (ttsOptions.includeAction && line.action) {
        if (controller.isCancelled) break;
        const actionSpeed = currentLanguageSpeeds[defaultLanguage] || 1;
        await speakWithHighlight(line.action, defaultLanguage, actionSpeed, (word) => onWordStart?.(word, 'action', sceneIdx, lineIdx));
      }
    }
  }

  if (onLineStart && !controller.isCancelled) onLineStart(-1, -1);
};

export const speakWithHighlight = (text, lang = 'English', rate = 1, onWordStart, onStart) => {
  return new Promise((resolve) => {
    const langCode = convertLangToISO(lang);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;

    const voice = getVoiceForLanguage(langCode);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = rate;
    if (onStart) utterance.onstart = onStart;
    utterance.onend = resolve;
    utterance.onerror = resolve;

    const words = text.split(/\s+/).filter(w => w.length > 0);
    let currentWordIndex = 0;
    let startTime = 0;
    let wordDurations = [];
    let timeoutIds = [];

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
    utterance.onend = () => {
      // Clear any remaining timeouts
      timeoutIds.forEach(id => clearTimeout(id));
      // Clear any remaining highlights
      if (onWordStart) onWordStart(null);
      originalOnEnd?.();
      resolve();
    };

    synth.speak(utterance);
  });
};
