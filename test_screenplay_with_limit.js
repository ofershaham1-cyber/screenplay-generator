import { OpenRouter } from '@openrouter/sdk';

const theModel = 'xiaomi/mimo-v2-flash:free';
const OPENROUTER_API_KEY = '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';

const openRouter = new OpenRouter({
  apiKey: OPENROUTER_API_KEY,
  // defaultHeaders: {
  //   'HTTP-Referer': '<YOUR_SITE_URL>', // Optional. Site URL for rankings on openrouter.ai.
  //   'X-Title': '<YOUR_SITE_NAME>', // Optional. Site title for rankings on openrouter.ai.
  // },
});

const completion = await openRouter.chat.send({
  model: theModel,
  messages: [
    {
      role: 'user',
      content: `Create a screenplay that follows this specific structure:
      {
        limitations: {
          story_pitch: 30,                       // Maximum words for the story pitch.
          exposition: 100,                       // Maximum words for the exposition.
          character_description: 50,             // Maximum words for character descriptions.
          scene_description: 100,                 // Maximum words for scene descriptions.
          transition: 30,                         // Maximum words for transitions.
          dialogue_text: 30                       // Maximum words for dialogue text.
        },
        default_translation_language: "Hebrew", // Default language for translations.
        story_pitch: "string",                     // A brief statement highlighting the unique aspects of the story.
        exposition: "string",                      // A summary of the story providing context.
        languages_used: ["string"],                // An array listing the languages spoken in the screenplay.
        cast: [
          {
            name: "string",                       // The character's name.
            description: "string",                // A brief description of the character's personality.
            role: "string",                       // How the character contributes to the story.
            language: "string"                    // The primary language the character speaks.
          }
        ],
        scenes: [
          {
            scene: "string",                      // A description of the location and context for the scene.
            transition: "string",                 // Description of scene transitions or important shifts.
            sound_effects: ["string"],            // An array of sound effects to be included in the audio.
            music_cues: ["string"],               // An array of music cues for the scene.
            dialogue: [
              {
                character: "string",              // The name of the character speaking.
                language: "string",               // The language used in the dialogue.
                text: "string",                   // The spoken dialogue text.
                translation: "string",            // Translation of the dialogue into the default translation language.
                visual: "string",                 // A description of the visual elements accompanying the dialogue.
                emotion: "string",                // The emotional state of the character delivering the line.
                tag: "string"                     // Optional: context or action related to the dialogue.
              }
            ]
          }
        ]
      }

      Ensure that the screenplay:
      - Includes a unique story pitch that captures the essence of the narrative.
      - Provides a detailed exposition that sets the context.
      - Lists all languages used in the dialogue.
      - Defines a cast of characters with their names, descriptions, roles, and languages.
      - Contains multiple scenes with transitions, sound effects, music cues, and dialogue that follows the specified character structure.
      - Uses clear and concise language for each element to facilitate audio and visual production.
      - Provides translations for all non-English dialogue quotes into the default translation language specified.
      - Adheres to the specified word count limits defined in the limitations object.
      `
    },
  ],
  stream: false,
});

console.log(completion.choices[0].message.content);