import { AppHeader } from "./AppHeader";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
