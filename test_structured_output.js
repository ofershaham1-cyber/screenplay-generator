import { OpenRouter } from '@openrouter/sdk';
import fs from 'fs/promises'; // Import the file system module to read files

const theModel = 'mistralai/devstral-2512:free';
const OPENROUTER_API_KEY = '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';

const openRouter = new OpenRouter({
  apiKey: OPENROUTER_API_KEY,
});

async function createScreenplay() {
  try {
    // Read the external JSON file
    const data = await fs.readFile('./responseFormat.json', 'utf8');
    const responseFormat = JSON.parse(data); // Parse the JSON data

    const completion = await openRouter.chat.send({
      model: theModel,
      messages: [
        {
          role: 'user',
          content: `Create a screenplay based on the sturctured format based on the following feilds setting: { languages_used: ${languages_used||''},story_pitch: ${story_pitch||''}}`,
        },
      ],
      responseFormat: responseFormat,
      plugins: [
        { id: 'response-healing' } // Plugin for response healing
      ],
      stream: false,
    });

    const screenplayData = JSON.parse(completion.choices[0].message.content);
    console.log(screenplayData);
  } catch (error) {
    console.error('Error creating screenplay:', error);
  }
}

// Call the function to create the screenplay
createScreenplay();