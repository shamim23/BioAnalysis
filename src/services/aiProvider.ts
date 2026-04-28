import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

export interface GenerateContentOptions {
  responseMimeType?: "application/json";
  enableSearch?: boolean;
}

export interface GenerateContentResult {
  text: string;
}

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  generateContent(prompt: string, options?: GenerateContentOptions): Promise<GenerateContentResult>;
}

const GEMINI_MODEL = "gemini-2.0-flash";
const OPENAI_MODEL = "gpt-4o-mini";

class GeminiProvider implements AIProvider {
  readonly name = "Gemini";
  readonly model = GEMINI_MODEL;
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateContent(
    prompt: string,
    options?: GenerateContentOptions
  ): Promise<GenerateContentResult> {
    const config: any = {};
    if (options?.responseMimeType === "application/json") {
      config.responseMimeType = "application/json";
    }
    if (options?.enableSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config,
    });

    return { text: response.text ?? "" };
  }
}

class OpenAIProvider implements AIProvider {
  readonly name = "OpenAI";
  readonly model = OPENAI_MODEL;
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }

  async generateContent(
    prompt: string,
    options?: GenerateContentOptions
  ): Promise<GenerateContentResult> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "user", content: prompt },
    ];

    const chatOptions: OpenAI.Chat.ChatCompletionCreateParams = {
      model: this.model,
      messages,
    };

    if (options?.responseMimeType === "application/json") {
      chatOptions.response_format = { type: "json_object" };
      // Ensure the prompt mentions JSON so the model knows what to do
      if (!prompt.toLowerCase().includes("json")) {
        messages[0].content = prompt + "\n\nRespond with valid JSON only.";
      }
    }

    const response = await this.client.chat.completions.create(chatOptions);
    const content = response.choices[0]?.message?.content ?? "";
    return { text: content };
  }
}

export function createAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER?.toLowerCase() || "gemini";

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    return new OpenAIProvider(apiKey);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GeminiProvider(apiKey);
}

export function getActiveEngineName(): string {
  const provider = process.env.AI_PROVIDER?.toLowerCase() || "gemini";
  if (provider === "openai") {
    return "OpenAI GPT-4o Mini";
  }
  return "Gemini 2.0 Flash";
}
