interface TogetherResponse {
  output: {
    text: string;
  };
}

class TogetherClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = "https://api.together.xyz/v1") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async complete({
    model,
    prompt,
    max_tokens = 2000,
    temperature = 0.7,
    top_p = 0.7,
    top_k = 50,
    repetition_penalty = 1,
  }: {
    model: string;
    prompt: string;
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repetition_penalty?: number;
  }): Promise<TogetherResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens,
        temperature,
        top_p,
        top_k,
        repetition_penalty,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API request failed: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return {
      output: {
        text: data.choices[0].message.content,
      },
    };
  }
}

export const together = new TogetherClient(
  import.meta.env.VITE_OPENAI_API_KEY,
  import.meta.env.VITE_AI_BASE_URL
);
