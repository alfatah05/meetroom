import type { AIRequest, AIResponse } from "@/types";

export interface ProviderStatus {
  ok: boolean;
  message?: string;
}

export interface AIProvider {
  id: string;
  name: string;
  isConfigured(): Promise<boolean>;
  generateResponse(request: AIRequest): Promise<AIResponse>;
  testConnection(): Promise<ProviderStatus>;
}
