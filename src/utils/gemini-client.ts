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
      throw new Error(
        "Google API key is required. For local development, set VITE_GOOGLE_API_KEY in your .env file. " +
        "For production deployment on Vercel:\n" +
        "1. Go to your Vercel project settings\n" +
        "2. Navigate to the 'Environment Variables' section\n" +
        "3. Add VITE_GOOGLE_API_KEY with your Google API key\n" +
        "4. Redeploy your application"
      );
    }
    
    // Trim any whitespace from the API key
    const cleanApiKey = apiKey.trim();
    
    // Validate API key format (basic check)
    if (cleanApiKey.length < 30) {
      throw new Error(
        "Invalid Google API key format: Key appears to be too short.\n" +
        "Please ensure you're using the complete API key from Google AI Studio.\n" +
        "For Vercel deployment, verify the environment variable in your project settings."
      );
    }
    
    if (!cleanApiKey.startsWith('AIza')) {
      throw new Error(
        "Invalid Google API key format: Key should start with 'AIza'.\n" +
        "Please ensure you're using a valid key from Google AI Studio.\n" +
        "For Vercel deployment, verify the environment variable in your project settings."
      );
    }

    // Debug log for development only
    if (import.meta.env.DEV) {
      console.log("API Key length:", cleanApiKey.length);
      console.log("API Key format valid:", cleanApiKey.startsWith('AIza'));
      console.log("Initializing Gemini client with model:", model);
    }
    
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

      // Debug log for development only
      if (import.meta.env.DEV) {
        console.log("Attempting to generate content with model:", this.model);
      }
      
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
      // Enhanced error logging for development only
      if (import.meta.env.DEV) {
        console.error("Gemini API Error Details:", {
          message: error.message,
          status: error.status,
          response: error.response,
          stack: error.stack
        });
      }
      
      if (error.message.includes("API Key not found") || error.message.includes("API_KEY_INVALID")) {
        throw new Error(
          "Invalid API key. Please ensure your Google API key is correctly set up:\n" +
          "For local development: Set VITE_GOOGLE_API_KEY in .env file\n" +
          "For Vercel deployment: Set VITE_GOOGLE_API_KEY in project environment variables\n" +
          "Get your API key from: https://makersuite.google.com/app/apikey\n" +
          "Error: " + error.message
        );
      } else if (error.message.includes("404")) {
        throw new Error(
          "Gemini API model not found. Please check:\n" +
          "1. If the model 'gemini-pro' is available in your Google Cloud Console\n" +
          "2. If the API version is correct in your environment variables\n" +
          "Error: " + error.message
        );
      } else if (error.message.includes("403")) {
        throw new Error(
          "Access denied. Please verify:\n" +
          "1. Your Google API key has the necessary permissions\n" +
          "2. The key is correctly set in your environment variables\n" +
          "Error: " + error.message
        );
      }
      
      throw new Error(`Gemini API request failed: ${error.message}`);
    }
  }
}

const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

// Debug log for development only
if (import.meta.env.DEV) {
  console.log("API Key available:", !!apiKey, "Length:", apiKey?.length || 0);
}

export const gemini = new GeminiClient(
  apiKey,
  import.meta.env.VITE_AI_MODEL
);
