import { OpenRouter } from '@openrouter/sdk';

const theModel = 'xiaomi/mimo-v2-flash:free';
const OPENROUTER_API_KEY = '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';
const openrouter = new OpenRouter({
  apiKey: OPENROUTER_API_KEY,
});

async function getResponse() {
  try {
    const result = await openrouter.callModel({
      model: theModel,

      instructions: 'You are a helpful coding assistant. Be concise and provide working code examples.',
      input: 'How do I read a file in Node.js?',
    });

    const text = await result.getText();
    console.log({ text });
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 400) {
      console.error('Model not available:', error.error?.message || error.message);
    } else {
      console.error('API Error:', error.message);
    }
  }
}

getResponse();