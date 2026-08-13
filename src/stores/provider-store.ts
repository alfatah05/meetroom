import { create } from "zustand";
import * as storage from "@/storage/indexeddb";
import { providerManager } from "@/providers/provider-manager";
import { GeminiProvider } from "@/providers/gemini-provider";
import { MockProvider } from "@/providers/mock-provider";

export type ProviderId = "mock" | "gemini";

export interface ProviderConfig {
  geminiApiKey: string;
  geminiModel: string;
  primaryProvider: ProviderId;
  enableMockFallback: boolean;
}

const DEFAULTS: ProviderConfig = {
  geminiApiKey: "",
  geminiModel: "gemini-2.0-flash",
  primaryProvider: "mock",
  enableMockFallback: true,
};

interface ProviderState {
  config: ProviderConfig;
  isHydrated: boolean;
  statusMessage: string | null;
  lastTest: { ok: boolean; message?: string } | null;

  hydrate: () => Promise<void>;
  updateConfig: (patch: Partial<ProviderConfig>) => Promise<void>;
  applyToManager: () => void;
  testGemini: () => Promise<{ ok: boolean; message?: string }>;
  clearKey: () => Promise<void>;
}

export const useProviderStore = create<ProviderState>((set, get) => ({
  config: { ...DEFAULTS },
  isHydrated: false,
  statusMessage: null,
  lastTest: null,

  hydrate: async () => {
    if (get().isHydrated) return;
    try {
      const saved = await storage.getSetting<ProviderConfig>("ai-providers");
      const config = { ...DEFAULTS, ...(saved ?? {}) };
      set({ config, isHydrated: true });
      get().applyToManager();
    } catch {
      set({ isHydrated: true });
      get().applyToManager();
    }
  },

  updateConfig: async (patch) => {
    const config = { ...get().config, ...patch };
    set({ config });
    // Never put keys in project export — only settings store
    await storage.setSetting("ai-providers", config);
    get().applyToManager();
  },

  applyToManager: () => {
    const { config } = get();
    providerManager.reset();
    providerManager.register(new MockProvider());
    if (config.geminiApiKey.trim()) {
      providerManager.register(
        new GeminiProvider(config.geminiApiKey.trim(), config.geminiModel)
      );
    }
    const primary =
      config.primaryProvider === "gemini" && config.geminiApiKey.trim()
        ? "gemini"
        : "mock";
    providerManager.setPrimary(primary);
    providerManager.setAllowMockFallback(config.enableMockFallback);
  },

  testGemini: async () => {
    const key = get().config.geminiApiKey.trim();
    if (!key) {
      const r = { ok: false, message: "Enter an API key first" };
      set({ lastTest: r });
      return r;
    }
    const provider = new GeminiProvider(key, get().config.geminiModel);
    const r = await provider.testConnection();
    const normalized = { ok: r.ok, message: r.message ?? (r.ok ? "OK" : "Failed") };
    set({ lastTest: normalized });
    return normalized;
  },

  clearKey: async () => {
    await get().updateConfig({
      geminiApiKey: "",
      primaryProvider: "mock",
    });
    set({ lastTest: null, statusMessage: "API key removed from this device" });
  },
}));
