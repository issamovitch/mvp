# موقعنا — Arabic Messenger-style Chat MVP

A real-time, Facebook Messenger–style private chat for a members website.
Arabic interface, fully RTL, built with Next.js (App Router), TypeScript,
Tailwind CSS, and Socket.io.

**No database. `npm run dev` starts Next.js; the platform automatically builds and starts the Socket.io mini-service.**

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  npm run dev                                                  │
│  → next dev -p 3000          (Next.js on port 3000)           │
│                                                               │
│  Platform automatically:                                      │
│  → builds mini-services/chat-service/ → mini-service-chat-service.js │
│  → starts it in background   (Socket.io on port 3003)         │
│                                                               │
│  Caddy gateway (port 81):                                     │
│  → / → port 3000 (Next.js)                                    │
│  → /?XTransformPort=3003 → port 3003 (Socket.io)              │
└─────────────────────────────────────────────────────────────┘
```

The Socket.io service lives in `mini-services/chat-service/` — the
platform's built-in scripts (`mini-services-install.sh`,
`mini-services-build.sh`, `mini-services-start.sh`) automatically install
its dependencies, build it, and start it in the background alongside
Next.js. No custom server, no `instrumentation.ts`, no background
processes in the dev script.

## Features

| # | Feature |
|---|---------|
| 1 | Members website page (header with logo "موقعنا", hero, feature cards) |
| 2 | Sidebar "الأعضاء المتصلون" with real-time green/gray presence dots |
| 3 | Click a member → floating chat window docked at bottom-right |
| 4 | Multiple windows (max 3 visible, rest collapse to round avatar bubbles) |
| 5 | Minimize and close each window |
| 6 | Instant send/receive, "يكتب الآن..." typing indicator, "تمت المشاهدة" seen status |
| 7 | Messages saved in memory, full history reloads on reopen |
| 8 | Unread counter badges on sidebar members and collapsed bubbles |
| 9 | Mobile responsive: chat opens full-screen with back button |

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack) + TypeScript 5
- **Styling**: Tailwind CSS 4 + custom CSS variables for the Messenger palette
- **Real-time**: Socket.io mini-service (`mini-services/chat-service`, port 3003)
- **State**: Zustand store (`src/store/chat-store.ts`)
- **Auth**: Cookie-based session (bcrypt-hashed passwords)
- **Storage**: In-memory (`src/lib/store.ts`) — no database

## Project Structure

```
.
├── mini-services/
│   └── chat-service/
│       ├── package.json          # own deps (socket.io)
│       └── index.ts              # Socket.io server on port 3003
├── src/
│   ├── app/
│   │   ├── layout.tsx            # <html lang="ar" dir="rtl"> + Cairo font
│   │   ├── page.tsx              # server component: login or app shell
│   │   ├── globals.css           # Tailwind + CSS variables + animations
│   │   └── api/
│   │       ├── auth/{login,logout,me}/route.ts
│   │       ├── members/route.ts
│   │       └── conversations/[memberId]/{messages,read}/route.ts
│   ├── components/messenger/     # 11 UI components
│   ├── hooks/use-socket.ts       # socket.io event wiring
│   ├── lib/
│   │   ├── store.ts              # in-memory data store + seed
│   │   ├── socket-client.ts      # singleton Socket.io client
│   │   ├── auth.ts               # cookie session helpers
│   │   └── utils.ts
│   └── store/chat-store.ts       # Zustand store
└── README.md
```

## Setup & Run

```bash
npm install        # or: bun install
npm run dev        # starts Next.js; platform auto-starts the Socket.io mini-service
```

Open the preview panel, log in as any member (password `123456`), and
start chatting.

## Seeded Members

All passwords: `123456`.

| Name | Avatar color |
|------|--------------|
| أحمد محمد | `#E5416E` |
| فاطمة علي | `#6280EE` |
| خالد العتيبي | `#F59E0B` |
| نورا الشمري | `#10B981` |
| سارة حسن | `#8B5CF6` |
| عمر إبراهيم | `#EC4899` |
