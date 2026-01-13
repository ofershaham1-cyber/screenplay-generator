import { OpenRouter } from '@openrouter/sdk';
import fs from 'fs/promises';

let openrouter;
let responseFormat;

const initializeOpenRouter = async () => {
  if (!openrouter) {
    const config = JSON.parse(await fs.readFile('./config.json', 'utf8'));
    responseFormat = JSON.parse(await fs.readFile('./responseFormat.json', 'utf8'));
    const OPENROUTER_API_KEY = config.apiKey.split('.')[0];

    openrouter = new OpenRouter({
      apiKey: OPENROUTER_API_KEY,
    });
  }
  return openrouter;
};

/**
 * @swagger
 * /api/screenplay/generate:
 *   post:
 *     summary: Generate screenplay
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               story_pitch:
 *                 type: string
 *               languages_used:
 *                 type: array
 *                 items:
 *                   type: string
 *               default_screenplay_language:
 *                 type: string
 *               model:
 *                 type: string
 *     responses:
 *       200:
 *         description: Generated screenplay
 */
export const generateScreenplay = async (req, res) => {
  const { story_pitch, languages_used, default_screenplay_language, model } = req.body;

  try {
    const openrouter = await initializeOpenRouter();
    const langs = languages_used || ['English', 'Spanish'];
    const defaultLang = default_screenplay_language || 'Hebrew';
    const promptContent = story_pitch
      ? `Create a screenplay based on this pitch: ${story_pitch}`
      : `Create a creative original screenplay. Use these languages for character dialogue: ${langs.join(', ')}. The default screenplay language (for all text except character dialogue) should be: ${defaultLang}.`;

    // Override using request payload
    responseFormat.jsonSchema.schema.properties.default_screenplay_language.default = default_screenplay_language;
    responseFormat.jsonSchema.schema.properties.languages_used.default = languages_used;
    responseFormat.jsonSchema.schema.properties.story_pitch.default = story_pitch;

    const completion = await openrouter.chat.send({
      model: model || 'allenai/olmo-3.1-32b-think:free',
      messages: [
        {
          role: 'user',
          content: promptContent,
        },
      ],
      responseFormat: responseFormat,
      plugins: [
        { id: 'response-healing' }
      ],
      stream: false,
    });

    const screenplayData = JSON.parse(completion.choices[0].message.content);
    res.json(screenplayData);
  } catch (error) {
    console.error('Error generating screenplay:', error);
    
    // Detailed error response when debug is enabled
    const errorResponse = req.isDebug 
      ? { 
          error: error.message,
          stack: error.stack,
          details: error.response?.data || error.cause || null,
          timestamp: new Date().toISOString()
        }
      : { error: error.message };
    
    res.status(500).json(errorResponse);
  }
};

/**
 * @swagger
 * /api/screenplay/format:
 *   get:
 *     summary: Get screenplay format schema
 *     responses:
 *       200:
 *         description: Format schema
 */
export const getScreenplayFormat = async (req, res) => {
  try {
    if (!responseFormat) {
      responseFormat = JSON.parse(await fs.readFile('./responseFormat.json', 'utf8'));
    }
    res.json(responseFormat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};