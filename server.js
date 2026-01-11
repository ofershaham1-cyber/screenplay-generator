import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { OpenRouter } from '@openrouter/sdk';
import fs from 'fs/promises';
//abc
const app = express();
const PORT = 3000;

const config = JSON.parse(await fs.readFile('./config.json', 'utf8'));
const responseFormat = JSON.parse(await fs.readFile('./responseFormat.json', 'utf8'));
const OPENROUTER_API_KEY = config.apiKey.split('.')[0];

const openrouter = new OpenRouter({
  apiKey: OPENROUTER_API_KEY,
});

app.use(express.json());

let chats = new Map();
let chatCounter = 0;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Chat API', version: '1.0.0' },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: ['./server.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /chat:
 *   post:
 *     summary: Create new chat
 *     responses:
 *       200:
 *         description: Chat created
 */
app.post('/chat', (req, res) => {
  const chatId = `chat_${++chatCounter}`;
  chats.set(chatId, { id: chatId, messages: [] });
  res.json({ chatId });
});

/**
 * @swagger
 * /chat/{chatId}/message:
 *   post:
 *     summary: Add user message
 *     parameters:
 *       - name: chatId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message added
 */
app.post('/chat/:chatId/message', (req, res) => {
  const { chatId } = req.params;
  const { text } = req.body;

  if (!chats.has(chatId)) return res.status(404).json({ error: 'Chat not found' });

  const chat = chats.get(chatId);
  chat.messages.push({ role: 'user', content: text });
  res.json({ chatId, messages: chat.messages });
});

/**
 * @swagger
 
 * /chat/{chatId}/response:
 *   post:
 *     summary: Get AI response
 *     parameters:
 *       - name: chatId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               model:
 *                 type: string
 *                 enum: [xiaomi/mimo-v2-flash:free, mistralai/devstral-2512:free, kwaipilot/kat-coder-pro:free, tngtech/deepseek-r1t2-chimera:free]
 *     responses:
 *       200:
 *         description: AI response
 */
app.post('/chat/:chatId/response', async (req, res) => {
  const { chatId } = req.params;
  const { model } = req.body;

  if (!chats.has(chatId)) return res.status(404).json({ error: 'Chat not found' });

  const chat = chats.get(chatId);
  if (chat.messages.length === 0) return res.status(400).json({ error: 'No messages' });

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages: chat.messages }),
    });

    const result = await response.json();
    const aiMessage = result.choices[0].message;
    chat.messages.push(aiMessage);
    res.json({ chatId, messages: chat.messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /chat/{chatId}/branch:
 *   post:
 *     summary: Create branch at message index
 *     parameters:
 *       - name: chatId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messageIndex:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Branch created
 */
app.post('/chat/:chatId/branch', (req, res) => {
  const { chatId } = req.params;
  const { messageIndex } = req.body;

  if (!chats.has(chatId)) return res.status(404).json({ error: 'Chat not found' });

  const chat = chats.get(chatId);
  if (messageIndex > chat.messages.length) return res.status(400).json({ error: 'Invalid index' });

  const newChatId = `chat_${++chatCounter}`;
  chats.set(newChatId, { id: newChatId, messages: chat.messages.slice(0, messageIndex) });
  res.json({ chatId: newChatId, messages: chats.get(newChatId).messages });
});

/**
 * @swagger
 * /chat/{chatId}/messages:
 *   get:
 *     summary: Get all chat messages
 *     parameters:
 *       - name: chatId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Messages retrieved
 */
app.get('/chat/:chatId/messages', (req, res) => {
  const { chatId } = req.params;
  if (!chats.has(chatId)) return res.status(404).json({ error: 'Chat not found' });
  res.json({ messages: chats.get(chatId).messages });
});

/**
 * @swagger
 * /chat/{chatId}/messages/count:
 *   get:
 *     summary: Get message count
 *     parameters:
 *       - name: chatId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Message count
 */
app.get('/chat/:chatId/messages/count', (req, res) => {
  const { chatId } = req.params;
  if (!chats.has(chatId)) return res.status(404).json({ error: 'Chat not found' });
  res.json({ count: chats.get(chatId).messages.length });
});

/**
 * @swagger
 * /chat/lang-conversation:
 *   post:
 *     summary: Generate a multilingual guessing game conversation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               model:
 *                 type: string
 *                 enum: [allenai/olmo-3.1-32b-think:free]
 *               languages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [ar, fr, ru, it, he, es]
 *     responses:
 *       200:
 *         description: Generated conversation
 */
app.post('/chat/lang-conversation', async (req, res) => {
  const { model, languages } = req.body;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'Generate at least 10 sentences with a maximum of 50 words per sentence. Create a conversation between an adult and a child playing a guessing game using the specified languages:arabic, russion. output format: {lang:string, text:string}[]'
          },

        ],

    temperature: 0.7,
        max_tokens: 1500
      }),
    });

    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /sdk/query:
 *   post:
 *     summary: Query using OpenRouter SDK
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               input:
 *                 type: string
 *     responses:
 *       200:
 *         description: SDK response
 */

app.post('/sdk/query', async (req, res) => {
  const { input } = req.body;
  input=input||"create a dialog between 2 people which speaks spanish and hebrew. result should be fomatted in the following structure: {language: string, text: string}[]"
// const result = openrouter.callModel({
//       model: 'allenai/olmo-3.1-32b-think:free',
//   instructions: 'You are a helpful coding assistant. Be concise and provide working code examples.',
//   input: 'How do I read a file in Node.js?',
// });


  
  try {
    const result = await openrouter.callModel({
      model: 'allenai/olmo-3.1-32b-think:free',
      input,
    });
    const text = await result.getText();
    res.json({ text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /screenplay/generate:
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
 *     responses:
 *       200:
 *         description: Generated screenplay
 */

/*
// the following fields: story_pitch: "${story_pitch}". languages_used: ${langs.join(', ')}, default_screenplay_language: ${defaultLang}.


*/
app.post('/screenplay/generate', async (req, res) => {
  const { story_pitch, languages_used, default_screenplay_language } = req.body;
console.log('/screenplay/generate',{body: req.body} );
  try {
    const langs = languages_used || ['English', 'Spanish'];
    const defaultLang = default_screenplay_language || 'Hebrew';
    const promptContent = story_pitch
      ? `Create a screenplay`
      : `Create a creative original screenplay. Use these languages for character dialogue: ${langs.join(', ')}. The default screenplay language (for all text except character dialogue) should be: ${defaultLang}.`;

    
    //override using request payload
  responseFormat.jsonSchema.schema.properties.default_screenplay_language.default = default_screenplay_language;
  responseFormat.jsonSchema.schema.properties.languages_used.default = languages_used;
  responseFormat.jsonSchema.schema.properties.story_pitch.default = story_pitch;
console.log({responseFormat: responseFormat.jsonSchema.schema.properties})
    
    const completion = await openrouter.chat.send({
      model: config.model,
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
    console.log({screenplayData})
    res.json(screenplayData);
  } catch (error) {
    console.error('Error generating screenplay:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/screenplay/format', async (req, res) => {
  res.json(responseFormat);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
});


