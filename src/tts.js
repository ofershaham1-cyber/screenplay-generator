const synth = window.speechSynthesis;

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

export const playScreenplay = async (screenplay, options = {}) => {
  const { includeNarrator = false, characterMode = true, onLineStart, languageSpeeds = {}, onWordStart } = options;
  const scenes = screenplay.scenes || [];

  for (let sceneIdx = 0; sceneIdx < scenes.length; sceneIdx++) {
    const scene = scenes[sceneIdx];

    if (includeNarrator && scene.scene) {
      await speakWithHighlight(`Scene: ${scene.scene}`, 'English', languageSpeeds['English'] || 1, onWordStart);
    }

    const dialogue = scene.dialogue || [];
    for (let lineIdx = 0; lineIdx < dialogue.length; lineIdx++) {
      const line = dialogue[lineIdx];

      if (includeNarrator && line.character) {
        await speakWithHighlight(`${line.character}`, 'English', languageSpeeds['English'] || 1, onWordStart);
      }

      const lang = characterMode && line.language ? line.language : 'English';
      const text = line.text || line.translation || '';
      const speed = languageSpeeds[lang] || 1;

      await speakWithHighlight(text, lang, speed, onWordStart, () => {
        if (onLineStart) onLineStart(sceneIdx, lineIdx);
      });
    }
  }

  if (onLineStart) onLineStart(-1, -1);
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

    // Estimate word durations based on word length and speaking rate
    const baseDuration = 1000 / rate; // milliseconds per character approximately
    words.forEach(word => {
      const duration = Math.max(word.length * baseDuration * 0.1, baseDuration * 0.3);
      wordDurations.push(duration);
    });

    const totalDuration = wordDurations.reduce((sum, dur) => sum + dur, 0);
    let cumulativeTime = 0;

    utterance.onstart = () => {
      startTime = Date.now();
      if (onStart) onStart();
      
      const highlightNextWord = () => {
        if (currentWordIndex < words.length) {
          if (onWordStart) onWordStart(words[currentWordIndex]);
          currentWordIndex++;
          
          if (currentWordIndex < words.length) {
            const nextDelay = wordDurations[currentWordIndex];
            setTimeout(highlightNextWord, nextDelay);
          }
        }
      };
      
      // Start highlighting the first word
      if (words.length > 0) {
        setTimeout(() => {
          if (onWordStart) onWordStart(words[0]);
          currentWordIndex = 1;
          
          // Schedule remaining words
          for (let i = 1; i < words.length; i++) {
            cumulativeTime += wordDurations[i - 1];
            setTimeout(() => {
              if (onWordStart) onWordStart(words[i]);
            }, cumulativeTime);
          }
        }, wordDurations[0] * 0.5); // Start highlighting midway through first word
      }
    };

    const originalOnEnd = utterance.onend;
    utterance.onend = () => {
      // Clear any remaining highlights
      if (onWordStart) onWordStart(null);
      originalOnEnd?.();
      resolve();
    };

    synth.speak(utterance);
  });
};
