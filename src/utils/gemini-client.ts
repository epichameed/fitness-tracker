import { GoogleGenerativeAI } from "@google/generative-ai";

interface GeminiResponse {
  output: {
    text: string;
  };
}

class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model: string = "gemini-pro") {
    if (!apiKey) {
      throw new Error("Google API key is required. Please set VITE_GOOGLE_API_KEY in your .env file");
    }
    
    // Trim any whitespace from the API key
    const cleanApiKey = apiKey.trim();
    
    // Validate API key format (basic check)
    if (cleanApiKey.length < 30) {
      throw new Error("Invalid Google API key format: Key appears to be too short. Please ensure you're using the complete API key from Google AI Studio.");
    }
    
    if (!cleanApiKey.startsWith('AIza')) {
      throw new Error("Invalid Google API key format: Key should start with 'AIza'. Please ensure you're using a valid key from Google AI Studio.");
    }

    // Debug log for development (remove in production)
    console.log("API Key length:", cleanApiKey.length);
    console.log("API Key format valid:", cleanApiKey.startsWith('AIza'));
    console.log("Initializing Gemini client with model:", model);
    
    this.genAI = new GoogleGenerativeAI(cleanApiKey);
    this.model = model;
  }

  async complete({
    prompt,
    max_tokens = 2000,
    temperature = 0.7,
  }: {
    model?: string;
    prompt: string;
    max_tokens?: number;
    temperature?: number;
  }): Promise<GeminiResponse> {
    try {
      if (!prompt) {
        throw new Error("Prompt is required for Gemini API");
      }

      // Debug log for development (remove in production)
      console.log("Attempting to generate content with model:", this.model);
      
      const model = this.genAI.getGenerativeModel({ model: this.model });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: max_tokens,
          topP: 0.8,
          topK: 40,
        },
      });

      const response = await result.response;
      const text = response.text();

      return {
        output: {
          text,
        },
      };
    } catch (error: any) {
      // Enhanced error logging
      console.error("Gemini API Error Details:", {
        message: error.message,
        status: error.status,
        response: error.response,
        stack: error.stack
      });
      
      if (error.message.includes("API Key not found") || error.message.includes("API_KEY_INVALID")) {
        throw new Error(
          "Invalid API key. Please ensure you're using a complete, valid API key from Google AI Studio (https://makersuite.google.com/app/apikey). " +
          "The key should be a long string starting with 'AIza'. Error: " + error.message
        );
      } else if (error.message.includes("404")) {
        throw new Error(
          "Gemini API model not found. Please check if the model 'gemini-pro' is available in your Google Cloud Console and API version is correct. " +
          "Error: " + error.message
        );
      } else if (error.message.includes("403")) {
        throw new Error(
          "Access denied. Please verify your Google API key has the necessary permissions in Google Cloud Console. " +
          "Error: " + error.message
        );
      }
      
      throw new Error(`Gemini API request failed: ${error.message}`);
    }
  }
}

const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
console.log("API Key available:", !!apiKey, "Length:", apiKey?.length || 0);

export const gemini = new GeminiClient(
  apiKey,
  import.meta.env.VITE_AI_MODEL
);
