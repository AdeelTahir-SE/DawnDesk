import { invoke } from "@tauri-apps/api/core";

export type AiProvider = "openai" | "anthropic" | "ollama";

export type AiProviderSettings = {
  api_key?: string | null;
  model?: string | null;
  image_model?: string | null;
  video_model?: string | null;
  ollama_mode?: "local" | "cloud" | string | null;
};

export type AiSettings = {
  default_provider?: AiProvider | string | null;
  openai: AiProviderSettings;
  anthropic: AiProviderSettings;
  ollama: AiProviderSettings;
};

export type GenerateTextOptions = {
  provider?: AiProvider;
  prompt: string;
  system?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

export type AiUsage = {
  provider: AiProvider;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requests: number;
  updatedAt: string;
};

export type GenerateTextResult = {
  text: string;
  provider: AiProvider;
  model: string;
  usage: AiUsage;
};

const AI_USAGE_KEY = "dawndesk_ai_token_usage";
const AI_USAGE_EVENT = "dawndesk_ai_token_usage_changed";
export const PROVIDER_LABELS: Record<AiProvider, string> = {
  openai: "ChatGPT",
  anthropic: "Claude",
  ollama: "Ollama",
};

const DEFAULT_SETTINGS: AiSettings = {
  default_provider: "openai",
  openai: { api_key: "", model: "gpt-4.1-mini", image_model: "gpt-image-1.5", video_model: "sora-2" },
  anthropic: { api_key: "", model: "claude-3-5-haiku-latest" },
  ollama: { api_key: "", model: "gpt-oss:120b", ollama_mode: "cloud" },
};

export const MODEL_OPTIONS: Record<AiProvider, { value: string; label: string }[]> = {
  openai: [
    { value: "gpt-4.1", label: "GPT-4.1" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 mini" },
    { value: "gpt-4.1-nano", label: "GPT-4.1 nano" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o mini" },
    { value: "o4-mini", label: "o4-mini" },
  ],
  anthropic: [
    { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
    { value: "claude-opus-4-6", label: "Claude Opus 4.6" },
    { value: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
    { value: "claude-3-7-sonnet-latest", label: "Claude 3.7 Sonnet" },
    { value: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku" },
  ],
  ollama: [
    { value: "gpt-oss:120b", label: "gpt-oss 120B Cloud" },
    { value: "gpt-oss:20b", label: "gpt-oss 20B Cloud" },
    { value: "llama3.1", label: "Llama 3.1 Local" },
    { value: "llama3.2", label: "Llama 3.2 Local" },
    { value: "mistral", label: "Mistral Local" },
    { value: "qwen2.5", label: "Qwen 2.5 Local" },
    { value: "codellama", label: "Code Llama Local" },
  ],
};

export const IMAGE_MODEL_OPTIONS = [
  { value: "gpt-image-1.5", label: "GPT Image 1.5" },
  { value: "gpt-image-1", label: "GPT Image 1" },
  { value: "gpt-image-1-mini", label: "GPT Image 1 mini" },
  { value: "chatgpt-image-latest", label: "ChatGPT Image latest" },
  { value: "dall-e-3", label: "DALL-E 3" },
];

export const VIDEO_MODEL_OPTIONS = [
  { value: "sora-2", label: "Sora 2" },
  { value: "sora-2-pro", label: "Sora 2 Pro" },
];

function normalizeProvider(value: string | null | undefined): AiProvider {
  return value === "anthropic" || value === "ollama" || value === "openai" ? value : "openai";
}

function withDefaults(settings: Partial<AiSettings> | null | undefined): AiSettings {
  const ollama = { ...DEFAULT_SETTINGS.ollama, ...settings?.ollama };
  if (!settings?.ollama?.ollama_mode && ollama.model && !ollama.model.includes("gpt-oss")) {
    ollama.model = DEFAULT_SETTINGS.ollama.model;
  }
  return {
    default_provider: normalizeProvider(settings?.default_provider),
    openai: { ...DEFAULT_SETTINGS.openai, ...settings?.openai },
    anthropic: { ...DEFAULT_SETTINGS.anthropic, ...settings?.anthropic },
    ollama,
  };
}

export async function getAiSettings(): Promise<AiSettings> {
  try {
    return withDefaults(await invoke<AiSettings>("get_ai_settings"));
  } catch {
    return withDefaults(null);
  }
}

export async function saveAiSettings(settings: AiSettings): Promise<AiSettings> {
  return withDefaults(await invoke<AiSettings>("set_ai_settings", { settings: withDefaults(settings) }));
}

export async function listOllamaModels(settings?: AiSettings): Promise<string[]> {
  const resolvedSettings = settings ? withDefaults(settings) : await getAiSettings();
  return invoke<string[]>("ai_list_ollama_models", { settings: resolvedSettings });
}

export async function verifyAiProvider(provider: AiProvider, settings?: AiSettings): Promise<string> {
  const resolvedSettings = settings ? withDefaults(settings) : await getAiSettings();
  return invoke<string>("ai_verify_provider", { provider, settings: resolvedSettings });
}

export function readAiUsage(): Record<AiProvider, AiUsage> {
  const now = new Date().toISOString();
  const empty: Record<AiProvider, AiUsage> = {
    openai: { provider: "openai", promptTokens: 0, completionTokens: 0, totalTokens: 0, requests: 0, updatedAt: now },
    anthropic: { provider: "anthropic", promptTokens: 0, completionTokens: 0, totalTokens: 0, requests: 0, updatedAt: now },
    ollama: { provider: "ollama", promptTokens: 0, completionTokens: 0, totalTokens: 0, requests: 0, updatedAt: now },
  };

  try {
    return { ...empty, ...JSON.parse(localStorage.getItem(AI_USAGE_KEY) || "{}") };
  } catch {
    return empty;
  }
}

function addUsage(provider: AiProvider, promptTokens: number, completionTokens: number): AiUsage {
  const usage = readAiUsage();
  const current = usage[provider];
  const next: AiUsage = {
    provider,
    promptTokens: current.promptTokens + promptTokens,
    completionTokens: current.completionTokens + completionTokens,
    totalTokens: current.totalTokens + promptTokens + completionTokens,
    requests: current.requests + 1,
    updatedAt: new Date().toISOString(),
  };
  usage[provider] = next;
  localStorage.setItem(AI_USAGE_KEY, JSON.stringify(usage));
  window.dispatchEvent(new CustomEvent(AI_USAGE_EVENT, { detail: usage }));
  return next;
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.trim().length / 4));
}

export async function generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
  const settings = await getAiSettings();
  const provider = options.provider ?? normalizeProvider(settings.default_provider);
  const providerSettings = settings[provider];
  const model = options.model || providerSettings.model || DEFAULT_SETTINGS[provider].model || "";
  const data = await invoke<{
    text: string;
    provider: AiProvider;
    model: string;
    promptTokens: number;
    completionTokens: number;
  }>("ai_generate_text", {
    request: {
      provider,
      prompt: options.prompt,
      system: options.system,
      model,
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 1200,
    },
  });
  const text = data.text.trim();
  const usage = addUsage(
    data.provider,
    data.promptTokens || estimateTokens(options.prompt),
    data.completionTokens || estimateTokens(text),
  );
  return { text, provider: data.provider, model: data.model, usage };
}

export function subscribeToAiUsage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(AI_USAGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(AI_USAGE_EVENT, callback);
  };
}
