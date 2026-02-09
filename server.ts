import express, { Request, Response, NextFunction } from 'express';
// @ts-ignore - untyped module
import swaggerUi from 'swagger-ui-express';
// @ts-ignore - untyped module
import swaggerJsdoc from 'swagger-jsdoc';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateScreenplay, getScreenplayFormat } from './routes/screenplay.js';
import { getModels, initializeModels } from './routes/models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a log file with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(logsDir, `server-${timestamp}.log`);

// Logger utility
interface Logger {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
}

const logger: Logger = {
  log: (...args: unknown[]) => {
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
    console.log(message);
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`);
  },
  error: (...args: unknown[]) => {
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
    console.error(message);
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ERROR: ${message}\n`);
  },
  warn: (...args: unknown[]) => {
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
    console.warn(message);
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] WARN: ${message}\n`);
  },
  info: (...args: unknown[]) => {
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
    console.log(message);
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] INFO: ${message}\n`);
  }
};

// Expose logger globally for other routes
declare global {
  var logger: Logger;
}
global.logger = logger;

logger.log(`\n${'='.repeat(60)}`);
logger.log('Server starting - logging to:', logFile);
logger.log(`${'='.repeat(60)}\n`);

// Get local IP address (fallback)
function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (iface) {
      for (const addr of iface) {
        // Skip internal and non-IPv4 addresses
        if (addr.family === 'IPv4' && !addr.internal) {
          return addr.address;
        }
      }
    }
  }
  return 'localhost';
}

// Get server's domain/hostname, fallback to IP
function getServerAddress(): string {
  const hostname = os.hostname();
  // Only fall back to IP if hostname is literally 'localhost'
  // Otherwise use the domain/hostname as-is
  if (hostname === 'localhost') {
    return getLocalIP();
  }
  return hostname;
}

app.use(express.json());

// Request logging middleware - logs all incoming requests with full details on errors
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const originalSend = res.send;
  const originalJson = res.json;
  
  let logged = false; // Flag to prevent duplicate logging
  
  const logResponse = (data: unknown, status: number) => {
    if (logged) return; // Prevent duplicate logging
    logged = true;
    
    const duration = Date.now() - start;
    logger.log(`[${req.method}] ${req.path} - Status: ${status} - ${duration}ms`);
    
    // Log full request/response details on errors
    if (status >= 400) {
      logger.error(`\n${'─'.repeat(60)}`);
      logger.error(`ERROR RESPONSE for [${req.method}] ${req.path}`);
      logger.error(`${'─'.repeat(60)}`);
      logger.error('Request Headers:', JSON.stringify(req.headers, null, 2));
      logger.error('Request Body:', JSON.stringify(req.body, null, 2));
      logger.error('Response Status:', status);
      logger.error('Response Data:', typeof data === 'string' ? data : JSON.stringify(data, null, 2));
      logger.error(`${'─'.repeat(60)}\n`);
    } else if (req.query.debug || (req.body && typeof req.body === 'object' && 'debug' in req.body && req.body.debug)) {
      logger.log(`  Query:`, req.query);
      logger.log(`  Body:`, req.body);
    }
  };
  
  res.send = function(data: unknown) {
    const status = res.statusCode;
    logResponse(data, status);
    res.send = originalSend;
    return res.send(data);
  };
  
  res.json = function(data: unknown) {
    const status = res.statusCode;
    logResponse(data, status);
    res.json = originalJson;
    return res.json(data);
  };
  
  next();
});

// Enable CORS for all routes with logging
app.use((req: Request, res: Response, next: NextFunction): void => {
  const origin = req.headers.origin || 'unknown';
  logger.info(`CORS Request - Origin: ${origin}, Method: ${req.method}, Path: ${req.path}`);
  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    logger.info(`  → Preflight OK`);
    res.sendStatus(200);
    return;
  }
  
  logger.info(`  → Request proceeding`);
  next();
});

// Debug middleware - logs request/response when debug=true parameter is present
app.use((req: Request, res: Response, next: NextFunction) => {
  const isDebug = req.query.debug === 'true' || (req.body && typeof req.body === 'object' && 'debug' in req.body && req.body.debug === true);
  
  if (isDebug) {
    (req as any).isDebug = true;
    
    // Log incoming request
    console.log('\n=== DEBUG: Incoming Request ===');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Query:', req.query);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Headers:', req.headers);
    console.log('==============================\n');
    
    // Intercept response
    const originalJson = res.json;
    const originalStatus = res.status;
    let statusCode = 200;
    
    res.status = function(code: number) {
      statusCode = code;
      return originalStatus.call(this, code);
    };
    
    res.json = function(data: unknown) {
      console.log('\n=== DEBUG: Response ===');
      console.log('Status:', statusCode);
      console.log('Data:', JSON.stringify(data, null, 2));
      console.log('======================\n');
      return originalJson.call(this, data);
    };
  }
  
  next();
});

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Screenplay API', version: '1.0.0' },
    servers: [{ url: '/' }],
  },
  apis: ['./server.ts', './routes/screenplay.ts', './routes/models.ts'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Serve swagger-ui static files
app.use('/api-docs', swaggerUi.serve);

// Serve swagger UI with dynamic host injection, prefer X-Forwarded-* headers and fallback to relative URL
app.get('/api-docs/', (req: Request, res: Response, next: NextFunction) => {
  // Prefer reverse proxy forwarded headers (used by GitHub Codespaces / Gitpod / similar)
  const forwardedProto = req.headers['x-forwarded-proto'];
  const forwardedHost = req.headers['x-forwarded-host'] || req.headers['x-forwarded-server'];
  const protocol = ((forwardedProto || req.protocol || 'http') as string).split(',')[0].trim();
  const host = forwardedHost || req.get('host');
  const hostStr = Array.isArray(host) ? host[0] : host;
  // If we have a forwarded host or a non-localhost host, use absolute URL; otherwise use relative root
  const useAbsolute = Boolean(forwardedHost) || (hostStr && !hostStr.startsWith('localhost'));
  const serverUrl = useAbsolute ? `${protocol}://${hostStr}` : '/';
  const specWithServers = {
    ...swaggerDocs,
    servers: [{ url: serverUrl }],
  };
  swaggerUi.setup(specWithServers)(req, res, next);
});

// Redirect root to /api-docs
app.get('/', (req: Request, res: Response) => {
  res.redirect('/api-docs');
});

// Screenplay routes
app.post('/api/screenplay/generate', generateScreenplay);
app.get('/api/screenplay/format', getScreenplayFormat);
app.get('/api/format-schema', getScreenplayFormat);

// Models route
app.get('/api/models', getModels);

const serverAddress = getServerAddress();
app.listen(PORT, () => {
  logger.log(`\n${'='.repeat(60)}`);
  logger.log(`Server running on http://${serverAddress}:${PORT}`);
  logger.log(`Swagger UI: http://${serverAddress}:${PORT}/api-docs`);
  logger.log(`Log file: ${logFile}`);
  logger.log(`${'='.repeat(60)}\n`);
  
  // Initialize models cache on startup
  initializeModels().catch(err => logger.error('Failed to initialize models:', err.message));
});
