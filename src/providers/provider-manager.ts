import type { AIProvider } from "./types";
import type { AIRequest, AIResponse } from "@/types";
import { MockProvider } from "./mock-provider";

type Listener = (msg: string) => void;

class AIProviderManager {
  private providers: AIProvider[] = [];
  private primaryId = "mock";
  private allowMockFallback = true;
  private listeners: Listener[] = [];

  constructor() {
    this.providers = [new MockProvider()];
  }

  onStatus(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(msg: string) {
    for (const l of this.listeners) l(msg);
  }

  reset() {
    this.providers = [];
  }

  register(provider: AIProvider) {
    if (!this.providers.find((p) => p.id === provider.id)) {
      this.providers.push(provider);
    }
  }

  setPrimary(id: string) {
    this.primaryId = id;
  }

  setAllowMockFallback(v: boolean) {
    this.allowMockFallback = v;
  }

  list() {
    return this.providers.map((p) => ({ id: p.id, name: p.name }));
  }

  getPrimaryId() {
    return this.primaryId;
  }

  private async withRetry(
    provider: AIProvider,
    request: AIRequest,
    attempts = 2
  ): Promise<AIResponse> {
    let lastError: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        return await provider.generateResponse(request);
      } catch (e) {
        lastError = e;
        const status = (e as { status?: number })?.status;
        // Don't retry auth errors
        if (status === 400 || status === 401 || status === 403) break;
        if (i < attempts - 1) {
          this.emit(`${provider.name} failed, retrying...`);
          await new Promise((r) => setTimeout(r, 400 * (i + 1)));
        }
      }
    }
    throw lastError;
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const ordered = [
      ...this.providers.filter((p) => p.id === this.primaryId),
      ...this.providers.filter((p) => p.id !== this.primaryId),
    ].filter((p) => {
      if (p.id === "mock" && !this.allowMockFallback && this.primaryId !== "mock") {
        return false;
      }
      return true;
    });

    let lastError: unknown;
    for (let i = 0; i < ordered.length; i++) {
      const provider = ordered[i];
      try {
        const configured = await provider.isConfigured();
        if (!configured) continue;
        if (i > 0) {
          this.emit(
            `${ordered[0]?.name ?? "Primary"} unavailable. Trying ${provider.name}...`
          );
        }
        const res = await this.withRetry(provider, request);
        if (i > 0) {
          this.emit(`Responding via ${provider.name}`);
        }
        return res;
      } catch (e) {
        lastError = e;
        console.warn(`Provider ${provider.id} failed`, e);
      }
    }
    this.emit("All AI providers are currently unavailable.");
    throw lastError ?? new Error("All AI providers unavailable");
  }
}

export const providerManager = new AIProviderManager();
