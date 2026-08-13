# Council

**Build a team. Challenge ideas. Make better decisions.**

Client-side AI project council. No backend required.

## Stack

Vite · React · TypeScript · Tailwind CSS · Zustand · React Router · IndexedDB  
Gemini API (BYOK) · Mock provider · Static deploy to shared hosting

## Phases complete

| Phase | Status |
|-------|--------|
| 1 Foundation | ✓ Dashboard, create project, personas, hiring |
| 2 Meeting | ✓ Room, topics, moderator, opinions, dock |
| 3 Decisions | ✓ History, Why?, action items, persist |
| 4 Memory | ✓ Structured memory, context retrieval, sync |
| 5 AI infra | ✓ Gemini BYOK, provider manager, retry, fallback |
| 6 Polish | ✓ Settings, export/import, status UI, privacy copy |

## Setup

```bash
npm install
npm run dev
```

## Gemini (optional)

1. Open **Settings**
2. Paste Gemini API key (Google AI Studio)
3. Test connection → Save
4. Set primary provider to **Google Gemini**
5. Enable Mock fallback if desired

Keys stay in **IndexedDB on this device only**. Never included in `.council.json` exports.

## Export / Import

- Project page → **Export** → `name.council.json`
- Dashboard → **Import** → restores project, decisions, memory (not API keys)

## Deploy (shared hosting)

```bash
npm run build
# upload contents of dist/
```

`public/.htaccess` provides SPA fallback for Apache. Nginx:

```
try_files $uri $uri/ /index.html;
```

## Routes

| Path | Page |
|------|------|
| `/` | Dashboard |
| `/project/new` | Create project |
| `/project/:id` | Overview |
| `/project/:id/team` | Hire team |
| `/project/:id/meeting` | Meeting room |
| `/project/:id/decisions` | Decision history |
| `/project/:id/memory` | Project memory |
| `/settings` | AI providers (BYOK) |
