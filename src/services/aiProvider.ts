import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

export type ModelTier = "fast" | "strong";

export interface GenerateContentOptions {
  responseMimeType?: "application/json";
  enableSearch?: boolean;
  tier?: ModelTier;
}

export interface GenerateContentResult {
  text: string;
}

export interface AIProvider {
  readonly name: string;
  generateContent(prompt: string, options?: GenerateContentOptions): Promise<GenerateContentResult>;
  modelFor(tier: ModelTier): string;
}

const GEMINI_MODELS: Record<ModelTier, string> = {
  fast: "gemini-2.0-flash",
  strong: "gemini-2.5-pro",
};

const OPENAI_MODELS: Record<ModelTier, string> = {
  fast: "gpt-4o-mini",
  strong: "gpt-4o",
};

class GeminiProvider implements AIProvider {
  readonly name = "Gemini";
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  modelFor(tier: ModelTier) {
    return GEMINI_MODELS[tier];
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
      model: this.modelFor(options?.tier ?? "fast"),
      contents: prompt,
      config,
    });

    return { text: response.text ?? "" };
  }
}

class OpenAIProvider implements AIProvider {
  readonly name = "OpenAI";
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }

  modelFor(tier: ModelTier) {
    return OPENAI_MODELS[tier];
  }

  async generateContent(
    prompt: string,
    options?: GenerateContentOptions
  ): Promise<GenerateContentResult> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "user", content: prompt },
    ];

    const chatOptions: OpenAI.Chat.ChatCompletionCreateParams = {
      model: this.modelFor(options?.tier ?? "fast"),
      messages,
    };

    if (options?.responseMimeType === "application/json") {
      chatOptions.response_format = { type: "json_object" };
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
    return `OpenAI (${OPENAI_MODELS.fast} / ${OPENAI_MODELS.strong})`;
  }
  return `Gemini (${GEMINI_MODELS.fast} / ${GEMINI_MODELS.strong})`;
}
