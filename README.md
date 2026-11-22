# موقعنا — Arabic Messenger-style Chat MVP

A real-time, Facebook Messenger–style private chat for a members website.
Arabic interface, fully RTL, built with Next.js (App Router), TypeScript,
Tailwind CSS, and Socket.io.

**No database. No custom server. `npm run dev` starts everything.**

## How it works

The app uses Next.js's `instrumentation.ts` hook (a standard Next.js feature
that runs on server startup) to start a Socket.io server on port 3003
within the same Node.js process as Next.js. The main `dev` script is just
`next dev -p 3000` — the Socket.io server starts automatically.

```
npm run dev
  → next dev -p 3000          (Next.js on port 3000, Turbopack)
    → instrumentation.ts      (runs on startup)
      → startChatServer()     (Socket.io on port 3003, same process)
        → in-memory store     (shared with Next.js API routes)
```

No custom server. No background processes. No separate terminal. Caddy
routes `/?XTransformPort=3003` to port 3003 for the browser's socket
connection.

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
- **Real-time**: Socket.io, started via `instrumentation.ts` (same process as Next.js)
- **State**: Zustand store (`src/store/chat-store.ts`)
- **Auth**: Cookie-based session (bcrypt-hashed passwords)
- **Storage**: In-memory (`src/lib/store.ts`) — no database

## Project Structure

```
.
├── src/
│   ├── instrumentation.ts         # Next.js startup hook → starts Socket.io
│   ├── app/
│   │   ├── layout.tsx             # <html lang="ar" dir="rtl"> + Cairo font
│   │   ├── page.tsx               # server component: login or app shell
│   │   ├── globals.css            # Tailwind + CSS variables + animations
│   │   └── api/
│   │       ├── auth/{login,logout,me}/route.ts
│   │       ├── members/route.ts
│   │       └── conversations/[memberId]/{messages,read}/route.ts
│   ├── components/messenger/      # 11 UI components (avatar, header, input, etc.)
│   ├── hooks/
│   │   └── use-socket.ts          # socket.io event wiring
│   ├── lib/
│   │   ├── chat-server.ts         # Socket.io server setup + event handlers
│   │   ├── store.ts               # in-memory data store + seed (no database)
│   │   ├── socket-client.ts       # singleton Socket.io client
│   │   ├── auth.ts                # cookie session helpers
│   │   └── utils.ts               # cn() helper
│   └── store/
│       └── chat-store.ts          # Zustand store
└── README.md
```

## Setup & Run

```bash
npm install        # or: bun install
npm run dev        # or: bun run dev
```

That's it. `next dev` starts Next.js on port 3000, and `instrumentation.ts`
automatically starts Socket.io on port 3003 within the same process. The
6 demo members are seeded into the in-memory store on first request.

Open the preview panel, log in as any member (password `123456`), and
start chatting. To test real-time across two users, open a second browser
session (private window to avoid cookie conflicts) and log in as a
different member.

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

## Design Tokens

```
Messenger blue:        #6280EE
Incoming bubble gray:  #F3F3F3
Online dot green:      #31A24C
Unread badge red:      #E41E3F
Border gray:           #E4E6EB
```
