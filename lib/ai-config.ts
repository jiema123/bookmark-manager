export const DEFAULT_AI_BASE_URL = "https://gemini-api.21588.org/v1beta/openai"
export const DEFAULT_AI_MODEL = "gemini-3-flash-preview"

export interface AISettings {
  enabled: boolean
  modelHost: string
  apiKey: string
  modelName: string
}

export const DEFAULT_CLIENT_AI_SETTINGS: AISettings = {
  enabled: false,
  modelHost: process.env.NEXT_PUBLIC_AI_MODEL_HOST || DEFAULT_AI_BASE_URL,
  apiKey: process.env.NEXT_PUBLIC_AI_API_KEY || "",
  modelName: process.env.NEXT_PUBLIC_AI_MODEL_NAME || DEFAULT_AI_MODEL,
}

export function getServerAIConfig() {
  return {
    apiKey: process.env.GEMINI_API_KEY || "",
    baseUrl: process.env.GEMINI_API_BASE_URL || DEFAULT_AI_BASE_URL,
    model: process.env.GEMINI_MODEL || DEFAULT_AI_MODEL,
  }
}
