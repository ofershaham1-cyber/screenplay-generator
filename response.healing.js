import fetch from 'node-fetch'; // Ensure you have node-fetch installed

async function getWeather() {
const OPENROUTER_API_KEY = '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';

  const apiKey = OPENROUTER_API_KEY; // Use the API key from the environment variable

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`, // Use the API key from the environment variable
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistralai/devstral-2512:free', // Update to the correct model
        messages: [
          {
            role: 'user',
            content: 'What is the weather like in London?',
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'weather',
            schema: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'City or location name',
                },
                temperature: {
                  type: 'number',
                  description: 'Temperature in Celsius',
                },
                conditions: {
                  type: 'string',
                  description: 'Weather conditions description',
                },
              },
              required: ['location', 'temperature', 'conditions'],
            },
          },
        },
        plugins: [
          { id: 'response-healing' } // Plugin for response healing
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`); // Check if response is ok
    }

    const data = await response.json(); // Parse the JSON response
    const weatherInfo = JSON.parse(data.choices[0].message.content); // Parse the content
    console.log(`Location: ${weatherInfo.location}, Temperature: ${weatherInfo.temperature}°C, Conditions: ${weatherInfo.conditions}`); // Output the weather information
  } catch (error) {
    console.error('Error fetching weather information:', error);
  }
}

// Call the function to get the weather
getWeather(); // Just call the function without assigning to a variable