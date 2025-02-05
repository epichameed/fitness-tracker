import { together } from "./together-client";
import { gemini } from "./gemini-client";

interface AIResponse {
  output: {
    text: string;
  };
}

class AIClient {
  private provider: "together" | "gemini";

  constructor(provider: "together" | "gemini" = "together") {
    this.provider = provider;
  }

  async complete(options: {
    model: string;
    prompt: string;
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repetition_penalty?: number;
  }): Promise<AIResponse> {
    try {
      if (this.provider === "together") {
        return together.complete(options);
      } else {
        // Filter out unsupported parameters for Gemini
        const { prompt, max_tokens, temperature } = options;
        return gemini.complete({
          prompt,
          max_tokens,
          temperature,
        });
      }
    } catch (error) {
      console.error(`${this.provider} API Error:`, error);
      throw error;
    }
  }
}

export const aiClient = new AIClient(
  (import.meta.env.VITE_AI_PROVIDER as "together" | "gemini") || "gemini"
);
