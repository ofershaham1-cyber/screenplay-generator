import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { Request, Response } from 'express';

const MODELS_URL = 'https://openrouter.ai/api/frontend/models/find?fmt=table&max_price=0&order=newest&supported_parameters=structured_outputs%2Cmax_tokens%2Cresponse_format';
const MODELS_FILE = path.join(process.cwd(), 'models.json');

let cachedModels: unknown = null;
let cacheTimestamp: number | null = null;
const CACHE_TTL = 3600000; // 1 hour in milliseconds

interface Logger {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
}

declare global {
  var logger: Logger;
}

const fetchAndCacheModels = async () => {
  try {
    global.logger?.log('Fetching models from OpenRouter...');
    const r = await fetch(MODELS_URL);
    if (!r.ok) {
      global.logger?.error(`OpenRouter API returned ${r.status}`);
      return null;
    }
    const data = await r.json();
    global.logger?.log(`Successfully fetched models. Response type: ${typeof data}, isArray: ${Array.isArray(data)}`);
    global.logger?.log('Sample:', JSON.stringify(data).substring(0, 200));
    cachedModels = data;
    cacheTimestamp = Date.now();
    return data;
  } catch (error) {
    global.logger?.error('Error fetching models from OpenRouter:', (error as Error).message);
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
export const getModels = async (req: Request, res: Response): Promise<void> => {
  try {
    // Return cached data if fresh, otherwise fetch
    if (cachedModels && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_TTL) {
      global.logger?.log('Serving cached models');
      res.json(cachedModels);
      return;
    }

    const data = await fetchAndCacheModels();
    if (!data) {
      res.status(500).json({ error: 'Failed to fetch models from OpenRouter' });
      return;
    }

    res.json(data);
  } catch (error) {
    global.logger?.error('Error in getModels:', (error as Error).message);
    res.status(500).json({ error: (error as Error).message });
  }
};

// Optionally fetch models on startup
export const initializeModels = async () => {
  global.logger?.log('Initializing models cache on server startup...');
  await fetchAndCacheModels();
};
