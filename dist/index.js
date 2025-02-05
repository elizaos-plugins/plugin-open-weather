var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/actions/getCurrentWeather.ts
import { composeContext, elizaLogger } from "@elizaos/core";
import { generateMessageResponse } from "@elizaos/core";
import {
  ModelClass
} from "@elizaos/core";

// src/environment.ts
import { z } from "zod";
var openWeatherEnvSchema = z.object({
  OPEN_WEATHER_API_KEY: z.string().min(1, "OpenWeather API key is required")
});
async function validateOpenWeatherConfig(runtime) {
  try {
    const config = {
      OPEN_WEATHER_API_KEY: runtime.getSetting("OPEN_WEATHER_API_KEY")
    };
    return openWeatherEnvSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join("\n");
      throw new Error(
        `OpenWeather configuration validation failed:
${errorMessages}`
      );
    }
    throw error;
  }
}

// src/templates.ts
var getCurrentWeatherTemplate = `Respond with a JSON object containing location information for weather data.
Extract the location from the most recent message. If no specific location is provided, respond with an error.

The response must include:
- city: The city name
- country: The country code (ISO 2-letter code)

Example response:
\`\`\`json
{
    "city": "London",
    "country": "GB"
}
\`\`\`
{{recentMessages}}
Extract the location from the most recent message.
Respond with a JSON markdown block containing both city and country.`;

// src/examples.ts
var getCurrentWeatherExamples = [
  [
    {
      user: "{{user1}}",
      content: {
        text: "What's the weather like right now?"
      }
    },
    {
      user: "{{agent}}",
      content: {
        text: "In what city?"
      }
    },
    {
      user: "{{user1}}",
      content: {
        text: "Tokyo"
      }
    },
    {
      user: "{{agent}}",
      content: {
        text: "Let me check the current weather in Tokyo for you.",
        action: "GET_CURRENT_WEATHER"
      }
    },
    {
      user: "{{agent}}",
      content: {
        text: "It's currently 22\xB0C, feels like 29\xB0C, and is sunny in Tokyo."
      }
    }
  ],
  [
    {
      user: "{{user1}}",
      content: {
        text: "What's the weather in Toronto?"
      }
    },
    {
      user: "{{agent}}",
      content: {
        text: "I'll check the current weather in Toronto for you.",
        action: "GET_CURRENT_WEATHER"
      }
    },
    {
      user: "{{agent}}",
      content: {
        text: "It's currently 22\xB0C and cloudy in Toronto."
      }
    }
  ],
  [
    {
      user: "{{user1}}",
      content: {
        text: "Is it raining in Paris?"
      }
    },
    {
      user: "{{agent}}",
      content: {
        text: "I'll check the current weather conditions in Paris.",
        action: "GET_CURRENT_WEATHER"
      }
    },
    {
      user: "{{agent}}",
      content: {
        text: "In Paris, it's currently cloudy with light rain. The temperature is 15\xB0C."
      }
    }
  ]
];

// src/services.ts
var BASE_URL = "https://api.openweathermap.org/data/2.5";
var createWeatherService = (apiKey) => {
  const getWeather = async (city, country) => {
    if (!apiKey || !city) {
      throw new Error("Invalid parameters");
    }
    try {
      const location = country ? `${city},${country}` : city;
      const url = new URL(`${BASE_URL}/weather`);
      url.searchParams.append("q", location);
      url.searchParams.append("appid", apiKey);
      url.searchParams.append("units", "metric");
      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || response.statusText);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Weather API Error:", error.message);
      throw error;
    }
  };
  return { getWeather };
};

// src/actions/getCurrentWeather.ts
var getCurrentWeatherAction = {
  name: "GET_CURRENT_WEATHER",
  similes: [
    "WEATHER",
    "TEMPERATURE",
    "FORECAST",
    "WEATHER_REPORT",
    "WEATHER_UPDATE",
    "CHECK_WEATHER",
    "WEATHER_CHECK",
    "CHECK_TEMPERATURE",
    "WEATHER_OUTSIDE"
  ],
  description: "Get the current weather for a given location",
  validate: async (runtime) => {
    await validateOpenWeatherConfig(runtime);
    return true;
  },
  handler: async (runtime, message, state, _options, callback) => {
    let currentState = state;
    if (!currentState) {
      currentState = await runtime.composeState(message);
    }
    currentState = await runtime.updateRecentMessageState(currentState);
    const weatherContext = composeContext({
      state: currentState,
      template: getCurrentWeatherTemplate
    });
    const content = await generateMessageResponse({
      runtime,
      context: weatherContext,
      modelClass: ModelClass.SMALL
    });
    const hasLocation = content?.city && content?.country && !content?.error;
    if (!hasLocation) {
      return;
    }
    const config = await validateOpenWeatherConfig(runtime);
    const weatherService = createWeatherService(
      config.OPEN_WEATHER_API_KEY
    );
    try {
      const weatherData = await weatherService.getWeather(
        String(content?.city || ""),
        content?.country ? String(content?.country) : void 0
      );
      elizaLogger.success(
        `Successfully fetched weather for ${content.city}, ${content.country}`
      );
      if (callback) {
        callback({
          text: `The current weather in ${content.city}, ${content.country} is ${weatherData.main.temp}\xB0C, feels like ${weatherData.main.feels_like}\xB0C, and is ${weatherData.weather[0].description} with a wind speed of ${weatherData.wind.speed} km/h.`,
          content: weatherData
        });
        return true;
      }
    } catch (error) {
      elizaLogger.error("Error in GET_CURRENT_WEATHER handler:", error);
      callback({
        text: `Error fetching weather: ${error.message}`,
        content: { error: error.message }
      });
      return false;
    }
    return;
  },
  examples: getCurrentWeatherExamples
};

// src/actions/index.ts
var actions_exports = {};
__export(actions_exports, {
  getCurrentWeatherAction: () => getCurrentWeatherAction
});

// src/index.ts
var openWeatherPlugin = {
  name: "openweather",
  description: "OpenWeather plugin for Eliza",
  actions: [getCurrentWeatherAction],
  evaluators: [],
  providers: []
};
var index_default = openWeatherPlugin;
export {
  actions_exports as actions,
  index_default as default,
  openWeatherPlugin
};
//# sourceMappingURL=index.js.map