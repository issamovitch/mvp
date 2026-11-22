# موقعنا — Arabic Messenger-style Chat MVP

A real-time, Facebook Messenger–style private chat for a members website.
Arabic interface, fully RTL, built with Next.js (App Router), TypeScript,
Tailwind CSS, and Socket.io.

**No database. `npm run dev` starts everything (Next.js + Socket.io).**

## Features

| # | Feature | Implementation |
|---|---------|----------------|
| 1 | Members website page (logo "موقعنا", placeholder content) | `src/app/page.tsx` + `src/components/messenger/chat-app-shell.tsx` |
| 2 | Sidebar "الأعضاء المتصلون" with real-time green/gray dots | `members-sidebar.tsx` + presence broadcast in `mini-services/chat-service` |
| 3 | Click member → floating chat window docked at the bottom | `chat-dock.tsx` + `chat-window.tsx` |
| 4 | Multiple windows side-by-side (max 3 visible, rest as round avatar bubbles) | `chat-dock.tsx` (`getMaxVisible`) |
| 5 | Minimize / close each window | `chat-header.tsx` |
| 6 | Instant send/receive, "يكتب الآن..." typing indicator, "تمت المشاهدة" seen status | Socket.io events `message-sent`, `typing`, `message-seen` |
| 7 | Messages saved in memory, full history reloads on reopen | `src/lib/store.ts` + `GET /api/conversations/[memberId]/messages` |
| 8 | Unread counter badges on members & minimized windows | `unreadCount` on `Member`, badges in sidebar + collapsed bubbles |
| 9 | Mobile responsive: chat opens full-screen with back button | responsive classes in `chat-window.tsx` + `chat-header.tsx` |

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack) + TypeScript 5
- **Styling**: Tailwind CSS 4 + custom CSS variables for the Messenger palette
- **Real-time**: Socket.io mini-service (`mini-services/chat-service`, port 3003)
- **State**: Zustand store (`src/store/chat-store.ts`)
- **Auth**: Cookie-based session (bcrypt-hashed passwords)
- **Storage**: In-memory (`src/lib/store.ts`) — no database, no Prisma

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   npm run dev (single command)                │
│                                                               │
│  ┌───────────────────────┐    ┌────────────────────────────┐ │
│  │   Next.js app          │    │   Socket.io chat-service   │ │
│  │   (pages + API routes) │    │   (presence + relay)       │ │
│  │   port 3000            │    │   port 3003                │ │
│  │   in-memory store      │    │   no data storage          │ │
│  └───────────┬───────────┘    └────────────┬───────────────┘ │
│              │                              │                  │
│              └──────── Caddy gateway ───────┘                  │
│                /?XTransformPort=3003 → port 3003               │
└─────────────────────────────────────────────────────────────┘
```

`npm run dev` starts both processes:
- **Next.js** on port 3000 (Turbopack dev server with all pages and API routes)
- **Socket.io** on port 3003 (real-time relay — presence, messages, typing, seen receipts)

The Caddy gateway routes socket.io requests from the browser via
`/?XTransformPort=3003` to port 3003. All other requests go to port 3000.

The in-memory store lives in the Next.js process. The Socket.io service is
a stateless relay — it just routes events between connected users.

## Project Structure

```
.
├── mini-services/
│   └── chat-service/
│       ├── package.json
│       └── index.ts               # Socket.io server on port 3003
├── src/
│   ├── app/
│   │   ├── layout.tsx             # <html lang="ar" dir="rtl"> + Cairo font
│   │   ├── page.tsx               # server component: login or app shell
│   │   ├── globals.css            # Tailwind + CSS variables + animations
│   │   └── api/
│   │       ├── auth/{login,logout,me}/route.ts
│   │       ├── members/route.ts
│   │       └── conversations/[memberId]/{messages,read}/route.ts
│   ├── components/messenger/
│   │   ├── avatar.tsx             # colored circle with Arabic initial
│   │   ├── status-dot.tsx         # green/gray presence indicator
│   │   ├── chat-header.tsx        # blue header w/ minimize, close, back
│   │   ├── chat-input.tsx         # pill input + paper-plane send
│   │   ├── message-bubble.tsx     # gray incoming / blue outgoing bubbles
│   │   ├── typing-indicator.tsx   # 3-dot animation
│   │   ├── chat-window.tsx        # single floating window
│   │   ├── chat-dock.tsx          # bottom dock with up to 3 windows + collapsed bubbles
│   │   ├── members-sidebar.tsx    # "الأعضاء المتصلون"
│   │   ├── login-form.tsx         # login screen w/ quick-fill buttons
│   │   └── chat-app-shell.tsx     # main app shell (header + main + sidebar + dock)
│   ├── hooks/
│   │   └── use-socket.ts          # socket.io event wiring (shared singleton)
│   ├── lib/
│   │   ├── store.ts               # in-memory data store + seed (no database)
│   │   ├── socket-client.ts       # singleton Socket.io client (XTransformPort)
│   │   ├── auth.ts                # cookie session helpers
│   │   └── utils.ts               # cn() helper
│   └── store/
│       └── chat-store.ts          # Zustand store (me, members, openChats, online)
└── README.md                      # this file
```

## Setup & Run

### 1. Install dependencies

```bash
npm install        # or: bun install
cd mini-services/chat-service && npm install && cd ..
```

### 2. Start everything

```bash
npm run dev        # or: bun run dev
```

This single command starts:
- Next.js dev server on port 3000 (Turbopack)
- Socket.io chat-service on port 3003

The 6 demo members are auto-seeded into the in-memory store on first request.

Open the app via the preview panel (or `http://localhost:81/` through the
Caddy gateway if you're on the sandbox).

### 3. Log in

The login screen lists all 6 demo members as quick-fill buttons. Click any
member, the password field is pre-filled with `123456`, then click **دخول**.

To test real-time messaging across two users, open the app in a second
browser session (or a private window so cookies don't conflict), log in as
a different member, and start chatting.

## Seeded Members

All passwords: `123456`. Seeded automatically on first API request.

| Name | Avatar color |
|------|--------------|
| أحمد محمد | `#E5416E` (pink-red) |
| فاطمة علي | `#6280EE` (Messenger blue) |
| خالد العتيبي | `#F59E0B` (amber) |
| نورا الشمري | `#10B981` (emerald) |
| سارة حسن | `#8B5CF6` (violet) |
| عمر إبراهيم | `#EC4899` (pink) |

## How Real-Time Works

1. After login, the client opens a Socket.io connection via
   `io("/?XTransformPort=3003")` — Caddy routes this to port 3003.
2. The client emits `authenticate` with the logged-in `userId`.
3. The chat-service tracks online users and broadcasts `user-online` /
   `user-offline` to everyone.
4. When a user sends a message:
   - The client POSTs to `/api/conversations/[memberId]/messages` (stores
     in the Next.js in-memory store).
   - On success, the client emits `message-sent` with the saved row.
   - The chat-service relays `new-message` to the recipient's sockets.
5. Typing indicator: the client emits `typing`; the service relays it.
6. Read receipts: when a chat is opened, the client POSTs to
   `/api/conversations/[memberId]/read` (marks seen in memory) and emits
   `message-seen`; the service relays `messages-seen` so the sender's
   outgoing bubbles flip to "تمت المشاهدة".

## Design Tokens

```
Messenger blue:        #6280EE  (header, outgoing bubbles, send button)
Messenger blue dark:   #4F6BE0  (hover)
Incoming bubble gray:  #F3F3F3
Online dot green:      #31A24C
Offline dot gray:      #B0B3B8
Unread badge red:      #E41E3F
Border gray:           #E4E6EB
Body background:       #F0F2F5
Card background:       #FFFFFF
```

## Notes

- All data lives in process memory. Restarting the Next.js server resets
  messages (the 6 members are re-seeded automatically).
- The Socket.io service is a stateless relay — it doesn't store any data.
- Passwords are hashed with `bcryptjs` (10 rounds).
- The dev script uses `trap 'kill 0' EXIT` to ensure the Socket.io
  background process is cleaned up when Next.js exits.
