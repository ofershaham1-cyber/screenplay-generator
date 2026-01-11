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
      content: "create a dialog between 2 people which speaks spanish and hebrew. result should be fomatted in the following structure: {language: string, text: string}[]",
    },
  ],
  stream: false,
});

console.log(completion.choices[0].message.content);
