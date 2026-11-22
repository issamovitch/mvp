# موقعنا — Arabic Messenger-style Chat MVP

A real-time, Facebook Messenger–style private chat for a members website.
Arabic interface, fully RTL, built with Next.js (App Router), TypeScript,
Tailwind CSS, and Socket.io.

**No database. No separate services. `npm run dev` starts everything.**

## Features

| # | Feature | Implementation |
|---|---------|----------------|
| 1 | Members website page (logo "موقعنا", placeholder content) | `src/app/page.tsx` + `src/components/messenger/chat-app-shell.tsx` |
| 2 | Sidebar "الأعضاء المتصلون" with real-time green/gray dots | `members-sidebar.tsx` + presence broadcast in `server.ts` |
| 3 | Click member → floating chat window docked at the bottom | `chat-dock.tsx` + `chat-window.tsx` |
| 4 | Multiple windows side-by-side (max 3 visible, rest as round avatar bubbles) | `chat-dock.tsx` (`getMaxVisible`) |
| 5 | Minimize / close each window | `chat-header.tsx` |
| 6 | Instant send/receive, "يكتب الآن..." typing indicator, "تمت المشاهدة" seen status | Socket.io events `message-sent`, `typing`, `message-seen` |
| 7 | Messages saved in memory, full history reloads on reopen | `src/lib/store.ts` + `GET /api/conversations/[memberId]/messages` |
| 8 | Unread counter badges on members & minimized windows | `unreadCount` on `Member`, badges in sidebar + collapsed bubbles |
| 9 | Mobile responsive: chat opens full-screen with back button | responsive classes in `chat-window.tsx` + `chat-header.tsx` |

Additional polish:
- Smooth open / minimize / new-message animations (CSS keyframes).
- Optimistic message send (UI updates instantly, replaced by the stored row on success).
- Soft shadow on floating windows, generous spacing, large readable Arabic font (Cairo).

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript 5
- **Styling**: Tailwind CSS 4 + custom CSS variables for the Messenger palette
- **Real-time**: Socket.io attached to the same HTTP server as Next.js (single port)
- **State**: Zustand store (`src/store/chat-store.ts`)
- **Auth**: Cookie-based session (bcrypt-hashed passwords)
- **Storage**: In-memory (`src/lib/store.ts`) — no database, no Prisma

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   server.ts (custom server)                  │
│  ┌───────────────────────┐    ┌────────────────────────────┐ │
│  │   Next.js app          │    │   Socket.io server         │ │
│  │   (pages + API routes) │    │   (presence + relay)       │ │
│  │   port 3000            │    │   port 3000 /socket.io/*   │ │
│  └───────────────────────┘    └────────────────────────────┘ │
│                  shared in-memory store                       │
│                  (src/lib/store.ts)                           │
└─────────────────────────────────────────────────────────────┘
```

A single `bun server.ts` (run via `npm run dev` / `bun run dev`) starts
the custom Next.js server with Socket.io attached. Both share the same
HTTP port and the same in-memory store. No database, no separate
processes, no `XTransformPort` routing.

## Project Structure

```
.
├── server.ts                      # custom Next.js server + Socket.io (single process)
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
│   │   ├── socket-client.ts       # singleton Socket.io client
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
```

### 2. Start the server

```bash
npm run dev        # or: bun run dev
```

That's it. The custom server (`server.ts`):
1. Seeds 6 demo members into the in-memory store (password `123456`).
2. Starts Next.js in dev mode.
3. Attaches Socket.io to the same HTTP server.
4. Listens on `http://localhost:3000`.

Open the app via the preview panel (or `http://localhost:81/` through the
Caddy gateway if you're on the sandbox).

### 3. Log in

The login screen lists all 6 demo members as quick-fill buttons. Click any
member, the password field is pre-filled with `123456`, then click **دخول**.

To test real-time messaging across two users, open the app in a second
browser session (or a private window so cookies don't conflict), log in as
a different member, and start chatting.

## Seeded Members

All passwords: `123456`. Seeded automatically on server startup.

| Name | Avatar color |
|------|--------------|
| أحمد محمد | `#E5416E` (pink-red) |
| فاطمة علي | `#6280EE` (Messenger blue) |
| خالد العتيبي | `#F59E0B` (amber) |
| نورا الشمري | `#10B981` (emerald) |
| سارة حسن | `#8B5CF6` (violet) |
| عمر إبراهيم | `#EC4899` (pink) |

## How Real-Time Works

1. After login, the client opens a Socket.io connection to the **same
   origin** (no separate port, no `XTransformPort`).
2. The client emits `authenticate` with the logged-in `userId`.
3. The server tracks online users (`userId -> Set<socketId>`) and
   broadcasts `user-online` / `user-offline` to everyone, so the sidebar
   shows real-time green/gray dots.
4. When a user sends a message:
   - The client POSTs to `/api/conversations/[memberId]/messages` (stores
     in the in-memory store).
   - On success, the client emits `message-sent` with the saved row.
   - The server relays `new-message` to the recipient's sockets.
5. Typing indicator: the client emits `typing` while the user is typing;
   the server relays it to the peer.
6. Read receipts: when a chat is opened, the client POSTs to
   `/api/conversations/[memberId]/read` (marks messages seen in memory)
   and emits `message-seen`; the server relays `messages-seen` so the
   sender's outgoing bubbles flip to "تمت المشاهدة".

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

- All data lives in process memory. Restarting the server resets messages
  (the 6 members are re-seeded automatically).
- The Socket.io path is `/socket.io/` (default), on the same port as
  Next.js. No `XTransformPort` query parameter is needed.
- Passwords are hashed with `bcryptjs` (10 rounds).
- The custom server uses Next.js's webpack dev mode (Turbopack is not
  supported with custom servers). Dev compiles are slightly slower but
  fully functional.
