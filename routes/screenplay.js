import { OpenRouter } from '@openrouter/sdk';
import fs from 'fs/promises';

let openrouter;
let responseFormat;
let defaultApiKey;

const initializeOpenRouter = async (customApiKey = null) => {
  // Priority: customApiKey > environment variable > config file
  let apiKeyToUse = customApiKey;
  
  if (!apiKeyToUse) {
    apiKeyToUse = process.env.OPENROUTER_API_KEY;
  }
  
  if (!apiKeyToUse) {
    const config = JSON.parse(await fs.readFile('./config.json', 'utf8'));
    apiKeyToUse = config.apiKey.split('.')[0];
  }
  
  defaultApiKey = apiKeyToUse;
  
  return new OpenRouter({
    apiKey: apiKeyToUse,
  });
};

const loadResponseFormat = async () => {
  if (!responseFormat) {
    responseFormat = JSON.parse(await fs.readFile('./responseFormat.json', 'utf8'));
  }
  return responseFormat;
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
 *               dialog_languages:
 *                 type: array
 *                 items:
 *                   type: string
 *               default_screenplay_language:
 *                 type: string
 *               model:
 *                 type: string
 *               customApiKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: Generated screenplay
 */
export const generateScreenplay = async (req, res) => {
  const { story_pitch, dialog_languages, default_screenplay_language, model, customApiKey } = req.body;

  try {
    global.logger?.log('📝 Screenplay Generation Request:');
    global.logger?.log('  Story Pitch:', story_pitch);
    global.logger?.log('  Languages Used:', dialog_languages?.join(', '));
    global.logger?.log('  Default Language:', default_screenplay_language);
    global.logger?.log('  Model:', model);
    global.logger?.log('  Custom API Key:', customApiKey ? 'provided' : 'not provided');
    
    const openrouter = await initializeOpenRouter(customApiKey);
    const format = await loadResponseFormat();
    
    const langs = dialog_languages || ['English', 'Spanish'];
    const defaultLang = default_screenplay_language || 'Hebrew';
    const promptContent = story_pitch
      ? `Create a screenplay based on this pitch: ${story_pitch}. use dialog_languages for the dialogs and default_screenplay_language for all other text. each character should speak in their respective dialog language.`
      : `Create a creative original screenplay. Use these languages for character dialog: ${langs.join(', ')}. The default screenplay language (for all text except character dialog) should be: ${defaultLang}.`;
 
    // Override using request payload
    format.jsonSchema.schema.properties.default_screenplay_language.default = default_screenplay_language;
    format.jsonSchema.schema.properties.dialog_languages.default = dialog_languages;
    format.jsonSchema.schema.properties.story_pitch.default = story_pitch;

    global.logger?.log('📋 Response Format Schema:', JSON.stringify(format, null, 2));
    
    const openrouterPayload = {
      model: model || 'allenai/olmo-3.1-32b-think:free',
      messages: [
        {
          role: 'user',
          content: promptContent,
        },
      ],
      responseFormat: format,
      plugins: [
        { id: 'response-healing' }
      ],
      stream: false,
    };
    
    global.logger?.log(`Calling OpenRouter API...`);
    global.logger?.log('📤 OpenRouter Request:');
    global.logger?.log('  Model:', openrouterPayload.model);
    global.logger?.log('  Messages:', JSON.stringify(openrouterPayload.messages, null, 2));
    global.logger?.log('  Response Format Schema:', JSON.stringify(openrouterPayload.responseFormat, null, 2));
    global.logger?.log('  Plugins:', JSON.stringify(openrouterPayload.plugins, null, 2));
    
    const completion = await openrouter.chat.send(openrouterPayload);

    global.logger?.log(`OpenRouter API response received successfully`);
    const screenplayData = JSON.parse(completion.choices[0].message.content);
    res.json(screenplayData);
  } catch (error) {
    // Log comprehensive error details
    global.logger?.error('═══════════════════════════════════════════════════');
    global.logger?.error('ERROR GENERATING SCREENPLAY');
    global.logger?.error('═══════════════════════════════════════════════════');
    
    // Log request details
    global.logger?.error('\n📥 REQUEST:');
    global.logger?.error('  Method: POST');
    global.logger?.error('  Path: /api/screenplay/generate');
    global.logger?.error('  Body:', JSON.stringify(req.body, null, 2));
    global.logger?.error('  Headers:', JSON.stringify(req.headers, null, 2));
    
    // Log error details
    global.logger?.error('\n⚠️  ERROR:');
    global.logger?.error('  Message:', error.message);
    global.logger?.error('  Status:', error.status || 'N/A');
    global.logger?.error('  Stack:', error.stack);
    
    // Log API response if available
    if (error.response) {
      global.logger?.error('\n📤 API RESPONSE:');
      global.logger?.error('  Status:', error.response.status);
      global.logger?.error('  StatusText:', error.response.statusText);
      global.logger?.error('  Headers:', JSON.stringify(error.response.headers, null, 2));
      global.logger?.error('  Data:', JSON.stringify(error.response.data || error.response.body, null, 2));
    }
    
    // Log additional error details
    if (error.cause) {
      global.logger?.error('\n🔗 CAUSE:');
      global.logger?.error(JSON.stringify(error.cause, null, 2));
    }
    
    global.logger?.error('═══════════════════════════════════════════════════\n');
    
    // Detailed error response when debug is enabled
    const errorResponse = req.isDebug 
      ? { 
          error: error.message,
          status: error.status,
          stack: error.stack,
          details: error.response?.data || error.response?.body || error.cause || null,
          requestBody: req.body,
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
    const format = await loadResponseFormat();
    res.json(format);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};