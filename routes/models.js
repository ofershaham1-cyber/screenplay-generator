import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

const MODELS_URL = 'https://openrouter.ai/api/frontend/models/find?fmt=table&max_price=0&order=newest&supported_parameters=structured_outputs%2Cmax_tokens%2Cresponse_format';
const MODELS_FILE = path.join(process.cwd(), 'models.json');

let cachedModels = null;
let cacheTimestamp = null;
const CACHE_TTL = 3600000; // 1 hour in milliseconds

const fetchAndCacheModels = async () => {
  try {
    global.logger?.log('Fetching models from OpenRouter...');
    const r = await fetch(MODELS_URL, { timeout: 10000 });
    if (!r.ok) {
      global.logger?.error(`OpenRouter API returned ${r.status}`);
      return null;
    }
    const data = await r.json();
    global.logger?.log(`Successfully fetched models. Response type: ${typeof data}, isArray: ${Array.isArray(data)}`);
    global.logger?.log('Sample:', JSON.stringify(data).substring(0, 200));
    cachedModels = data;
    cacheTimestamp = Date.now();
    
    // Write to JSON file
    try {
      await fs.writeFile(MODELS_FILE, JSON.stringify(data, null, 2), 'utf8');
      global.logger?.log(`Models written to ${MODELS_FILE}`);
    } catch (writeErr) {
      global.logger?.error('Failed to write models to file:', writeErr);
    }
    
    return data;
  } catch (error) {
    global.logger?.error('Error fetching models from OpenRouter:', error.message);
    return null;
  }
};

/**
 * @swagger
 * /api/models:
 *   get:
 *     summary: Get available free models from OpenRouter
 *     description: Fetches and caches the list of available free models with structured output support
 *     responses:
 *       200:
 *         description: List of available models
 *       500:
 *         description: Failed to fetch models from OpenRouter
 */
export const getModels = async (req, res) => {
  try {
    // Return cached data if fresh, otherwise fetch
    if (cachedModels && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_TTL) {
      global.logger?.log('Serving cached models');
      return res.json(cachedModels);
    }

    const data = await fetchAndCacheModels();
    if (!data) {
      return res.status(500).json({ error: 'Failed to fetch models from OpenRouter' });
    }

    res.json(data);
  } catch (error) {
    global.logger?.error('Error in getModels:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Optionally fetch models on startup
export const initializeModels = async () => {
  global.logger?.log('Initializing models cache on server startup...');
  await fetchAndCacheModels();
};

