import { OpenRouter } from '@openrouter/sdk';
import fs from 'fs/promises';
import { Request, Response } from 'express';
import { DEFAULT_MODEL, DEFAULT_DIALOG_LANGUAGES, DEFAULT_SCREENPLAY_LANGUAGE } from '../config/screenplay.js';

interface Logger {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
}

declare global {
  var logger: Logger;
}

let openrouter: OpenRouter | undefined;
let responseFormats: Record<string, unknown> = {};
let defaultApiKey: string | undefined;

const initializeOpenRouter = async (customApiKey: string | null = null) => {
  // Priority: customApiKey > environment variable > config file
  let apiKeyToUse = customApiKey || undefined;
  
  if (!apiKeyToUse) {
    apiKeyToUse = process.env.OPENROUTER_API_KEY;
  }
  
  if (!apiKeyToUse) {
    const config = JSON.parse(await fs.readFile('./config.json', 'utf8'));
    apiKeyToUse = (config.apiKey as string).split('.')[0];
  }
  
  defaultApiKey = apiKeyToUse;
  
  return new OpenRouter({
    apiKey: apiKeyToUse,
  });
};

const loadResponseFormat = async (type: string = 'screenplay') => {
  if (!responseFormats[type]) {
    const path = `./src/responseFormats/${type}.json`;
    responseFormats[type] = JSON.parse(await fs.readFile(path, 'utf8'));
  }
  return responseFormats[type];
};

const loadAllResponseFormats = async () => {
  if (Object.keys(responseFormats).length === 0) {
    const screenplay = await loadResponseFormat('screenplay');
    const audiobook = await loadResponseFormat('audiobook');
    responseFormats = { screenplay, audiobook };
  }
  return responseFormats;
};

interface GenerateScreenplayRequest {
  story_pitch?: string;
  dialog_languages?: string[];
  default_screenplay_language?: string;
  min_lines_per_dialog?: number;
  model?: string;
  customApiKey?: string;
  generationType?: 'screenplay' | 'audiobook';
}

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
export const generateScreenplay = async (req: Request, res: Response): Promise<void> => {
  const { story_pitch, dialog_languages, default_screenplay_language, min_lines_per_dialog, model, customApiKey, generationType = 'screenplay' } = req.body as GenerateScreenplayRequest;

  try {
    global.logger?.log(`📝 ${generationType.toUpperCase()} Generation Request:`);
    global.logger?.log('  Story Pitch:', story_pitch);
    global.logger?.log('  Languages Used:', dialog_languages?.join(', '));
    global.logger?.log('  Default Language:', default_screenplay_language);
    global.logger?.log('  Min Lines Per Dialog:', min_lines_per_dialog);
    global.logger?.log('  Generation Type:', generationType);
    global.logger?.log('  Model:', model);
    global.logger?.log('  Custom API Key:', customApiKey ? 'provided' : 'not provided');
    
    const openrouter = await initializeOpenRouter(customApiKey || null);
    const format = await loadResponseFormat(generationType);
    
    const langs = dialog_languages || DEFAULT_DIALOG_LANGUAGES;
    const defaultLang = default_screenplay_language || DEFAULT_SCREENPLAY_LANGUAGE;
    let promptContent: string;
    if (generationType === 'audiobook') {
      promptContent = story_pitch
        ? `Create an audiobook script based on this pitch: ${story_pitch}. Use these languages for character dialog: ${langs.join(', ')}.`
        : `Create a creative original audiobook script. Use these languages for character dialog: ${langs.join(', ')}.`;
    } else {
      promptContent = story_pitch
        ? `Create a screenplay based on this pitch: ${story_pitch}. use dialog_languages for the dialogs and default_screenplay_language for all other text. each character should speak in their respective dialog language.`
        : `Create a creative original screenplay. Use these languages for character dialog: ${langs.join(', ')}. The default screenplay language (for all text except character dialog) should be: ${defaultLang}.`;
    }
 
    // Override using request payload (only for screenplay format)
    const formatObj = format as any;
    if (generationType === 'screenplay') {
      formatObj.jsonSchema.schema.properties.default_screenplay_language.default = default_screenplay_language;
      formatObj.jsonSchema.schema.properties.dialog_languages.default = dialog_languages;
      formatObj.jsonSchema.schema.properties.story_pitch.default = story_pitch;
      formatObj.jsonSchema.schema.properties.limitations.properties.min_lines_per_dialog.default = min_lines_per_dialog;
    }

    global.logger?.log('📋 Response Format Schema:', JSON.stringify(format, null, 2));
    
    const openrouterPayload = {
      model: model || DEFAULT_MODEL,
      messages: [
        {
          role: 'user' as const,
          content: promptContent,
        },
      ],
      responseFormat: format,
      plugins: [
        { id: 'response-healing' }
      ],
      stream: false,
    };
    
    global.logger?.log(`Calling OpenRouter API for model: ${model}...`);
    global.logger?.log('📤 OpenRouter Request:');
    global.logger?.log('  Model:', openrouterPayload.model);
    global.logger?.log('  Messages:', JSON.stringify(openrouterPayload.messages, null, 2));
    global.logger?.log('  Response Format Schema:', JSON.stringify(openrouterPayload.responseFormat, null, 2));
    global.logger?.log('  Plugins:', JSON.stringify(openrouterPayload.plugins, null, 2));
    
    const completion = await openrouter.chat.send(openrouterPayload as any);

    global.logger?.log(`✓ OpenRouter API response received for model: ${model}`);
    const screenplayData = JSON.parse((completion.choices[0].message as any).content);
    res.json({ ...screenplayData, generatedAt: new Date().toISOString(), model });
  } catch (error) {
    const err = error as any;
    // Log comprehensive error details
    global.logger?.error('═══════════════════════════════════════════════════');
    global.logger?.error(`ERROR GENERATING SCREENPLAY FOR MODEL: ${model}`);
    global.logger?.error('═══════════════════════════════════════════════════');
    
    // Log request details
    global.logger?.error('\n📥 REQUEST:');
    global.logger?.error('  Method: POST');
    global.logger?.error('  Path: /api/screenplay/generate');
    global.logger?.error('  Body:', JSON.stringify(req.body, null, 2));
    global.logger?.error('  Headers:', JSON.stringify(req.headers, null, 2));
    
    // Log error details
    global.logger?.error('\n⚠️  ERROR:');
    global.logger?.error('  Message:', err.message);
    global.logger?.error('  Status:', err.status || 'N/A');
    global.logger?.error('  Stack:', err.stack);
    
    // Log API response if available
    if (err.response) {
      global.logger?.error('\n📤 API RESPONSE:');
      global.logger?.error('  Status:', err.response.status);
      global.logger?.error('  StatusText:', err.response.statusText);
      global.logger?.error('  Headers:', JSON.stringify(err.response.headers, null, 2));
      global.logger?.error('  Data:', JSON.stringify(err.response.data || err.response.body, null, 2));
    }
    
    // Log additional error details
    if (err.cause) {
      global.logger?.error('\n🔗 CAUSE:');
      global.logger?.error(JSON.stringify(err.cause, null, 2));
    }
    
    global.logger?.error('═══════════════════════════════════════════════════\n');
    
    // Detailed error response when debug is enabled
    const errorResponse = (req as any).isDebug 
      ? { 
          error: err.message,
          status: err.status,
          stack: err.stack,
          details: err.response?.data || err.response?.body || err.cause || null,
          requestBody: req.body,
          timestamp: new Date().toISOString()
        }
      : { error: err.message };
    
    res.status(500).json(errorResponse);
  }
};

/**
 * @swagger
 * /api/screenplay/format:
 *   get:
 *     summary: Get screenplay format schema(s)
 *     parameters:
 *       - in: query
 *         name: type
 *         description: Format type to retrieve (default: all)
 *         schema:
 *           type: string
 *           enum: [screenplay, audiobook, all]
 *     responses:
 *       200:
 *         description: Format schema(s)
 */
export const getScreenplayFormat = async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) || 'all';
    
    if (type === 'all') {
      const formats = await loadAllResponseFormats();
      res.json({ screenplay: formats.screenplay, audiobook: formats.audiobook });
    } else {
      const format = await loadResponseFormat(type);
      res.json(format);
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
