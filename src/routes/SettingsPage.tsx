import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProviderStore, type ProviderId } from "@/stores/provider-store";
import { ArrowLeft, Eye, EyeOff, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function SettingsPage() {
  const {
    config,
    isHydrated,
    hydrate,
    updateConfig,
    testGemini,
    clearKey,
    lastTest,
  } = useProviderStore();
  const [keyDraft, setKeyDraft] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated) setKeyDraft(config.geminiApiKey);
  }, [isHydrated, config.geminiApiKey]);

  async function saveKey() {
    await updateConfig({
      geminiApiKey: keyDraft.trim(),
      primaryProvider: keyDraft.trim() ? "gemini" : "mock",
    });
    setSavedMsg("Saved on this device only.");
    setTimeout(() => setSavedMsg(null), 2500);
  }

  async function onTest() {
    setTesting(true);
    if (keyDraft.trim() !== config.geminiApiKey) {
      await updateConfig({ geminiApiKey: keyDraft.trim() });
    }
    await testGemini();
    setTesting(false);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Projects
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted">AI providers · stored locally on your device</p>

        <div className="mt-4 flex gap-2 rounded-lg border border-border bg-card p-3 text-xs text-muted">
          <Shield className="h-4 w-4 shrink-0 text-accent" />
          <p>
            API keys stay in IndexedDB on this browser. They are not uploaded to a Council server,
            not included in project exports, and not shared between devices. You are responsible for
            usage and provider limits.
          </p>
        </div>

        <section className="mt-10 space-y-5">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted">
            Primary provider
          </h2>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "mock" as ProviderId, label: "Mock (offline / demo)" },
                { id: "gemini" as ProviderId, label: "Google Gemini" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() =>
                  void updateConfig({
                    primaryProvider: opt.id,
                  })
                }
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  config.primaryProvider === opt.id
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-card text-muted hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gemini-key">Gemini API key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="gemini-key"
                  type={showKey ? "text" : "password"}
                  autoComplete="off"
                  placeholder="AIza..."
                  value={keyDraft}
                  onChange={(e) => setKeyDraft(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                  onClick={() => setShowKey(!showKey)}
                  aria-label={showKey ? "Hide key" : "Show key"}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Get a key from Google AI Studio. Requests go directly from your browser to Google.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={config.geminiModel}
              onChange={(e) => void updateConfig({ geminiModel: e.target.value })}
              placeholder="gemini-2.0-flash"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.enableMockFallback}
              onChange={(e) =>
                void updateConfig({ enableMockFallback: e.target.checked })
              }
              className="rounded border-border"
            />
            Fall back to Mock if Gemini fails or is rate-limited
          </label>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void saveKey()}>Save key</Button>
            <Button variant="outline" onClick={() => void onTest()} disabled={testing}>
              {testing ? "Testing..." : "Test connection"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setKeyDraft("");
                void clearKey();
              }}
            >
              Remove key
            </Button>
          </div>

          {savedMsg && <p className="text-sm text-support">{savedMsg}</p>}
          {lastTest && (
            <p
              className={cn(
                "text-sm",
                lastTest.ok ? "text-support" : "text-oppose"
              )}
            >
              {lastTest.ok ? "✓" : "✕"} {lastTest.message}
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
