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
    this.genAI = new GoogleGenerativeAI(apiKey);
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
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error(`Gemini API request failed: ${error.message}`);
    }
  }
}

export const gemini = new GeminiClient(import.meta.env.VITE_OPENAI_API_KEY);
