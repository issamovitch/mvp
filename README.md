# موقعنا — Arabic Messenger-style Chat MVP

A real-time, Facebook Messenger–style private chat for a members website.
Arabic interface, fully RTL, built with Next.js (App Router), TypeScript,
Tailwind CSS, Prisma + SQLite, and Socket.io.

![Stack](https://img.shields.io/badge/stack-Next.js%20%7C%20TS%20%7C%20Tailwind%20%7C%20Prisma%20%7C%20Socket.io-6280EE)

## Features

| # | Feature | Implementation |
|---|---------|----------------|
| 1 | Members website page (logo "موقعنا", placeholder content) | `src/app/page.tsx` + `src/components/messenger/chat-app-shell.tsx` |
| 2 | Sidebar "الأعضاء المتصلون" with real-time green/gray dots | `members-sidebar.tsx` + presence broadcast in `mini-services/chat-service` |
| 3 | Click member → floating chat window docked at the bottom | `chat-dock.tsx` + `chat-window.tsx` |
| 4 | Multiple windows side-by-side (max 3 visible, rest as round avatar bubbles) | `chat-dock.tsx` (`getMaxVisible`) |
| 5 | Minimize / close each window | `chat-header.tsx` |
| 6 | Instant send/receive, "يكتب الآن..." typing indicator, "تمت المشاهدة" seen status | Socket.io events `message-sent`, `typing`, `message-seen` |
| 7 | All messages saved in DB, full history reloads on reopen | Prisma `Message` model + `GET /api/conversations/[memberId]/messages` |
| 8 | Unread counter badges on members & minimized windows | `unreadCount` on `Member`, badges in sidebar + collapsed bubbles |
| 9 | Mobile responsive: chat opens full-screen with back button | responsive classes in `chat-window.tsx` + `chat-header.tsx` |

Additional polish:
- Smooth open / minimize / new-message animations (CSS keyframes).
- Optimistic message send (UI updates instantly, replaced by the persisted row on success).
- Soft shadow on floating windows, generous spacing, large readable Arabic font (Cairo).

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript 5
- **Styling**: Tailwind CSS 4 + custom CSS variables for the Messenger palette
- **Database**: SQLite via Prisma ORM (`prisma/schema.prisma`)
- **Real-time**: Socket.io — backend in `mini-services/chat-service`, client via `socket.io-client`
- **State**: Zustand store (`src/store/chat-store.ts`)
- **Auth**: Cookie-based session (bcrypt-hashed passwords)

## Project Structure

```
.
├── prisma/
│   ├── schema.prisma              # User, Conversation, Message models
│   └── seed.ts                    # 6 demo members (password "123456")
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
│   │   └── use-socket.ts          # socket.io connection + event wiring
│   ├── store/
│   │   └── chat-store.ts          # Zustand store (me, members, openChats, online)
│   └── lib/
│       ├── db.ts                  # Prisma client singleton
│       └── auth.ts                # cookie session helpers
└── README.md                      # this file
```

## Setup & Run

### 1. Install dependencies

```bash
bun install
cd mini-services/chat-service && bun install && cd ..
```

### 2. Set up the database

The `.env` file is already configured:

```
DATABASE_URL=file:/home/z/my-project/db/custom.db
```

Push the schema and seed the demo members:

```bash
bun run db:push        # create tables (idempotent)
bun prisma/seed.ts     # insert 6 demo members, password "123456"
```

### 3. Start the Socket.io chat service

```bash
cd mini-services/chat-service
bun run dev            # hot reload, port 3003
```

Leave this running in a separate terminal.

### 4. Start Next.js

```bash
bun run dev            # port 3000
```

Open the app via the preview panel (or `http://localhost:81/` through the
Caddy gateway if you're on the sandbox).

### 5. Log in

The login screen lists all 6 demo members as quick-fill buttons. Click any
member, the password field is pre-filled with `123456`, then click **دخول**.

To test real-time messaging across two users, open the app in a second
browser session (or a private window so cookies don't conflict), log in as
a different member, and start chatting.

## Seeded Members

| Name | Avatar color |
|------|--------------|
| أحمد محمد | `#E5416E` (pink-red) |
| فاطمة علي | `#6280EE` (Messenger blue) |
| خالد العتيبي | `#F59E0B` (amber) |
| نورا الشمري | `#10B981` (emerald) |
| سارة حسن | `#8B5CF6` (violet) |
| عمر إبراهيم | `#EC4899` (pink) |

All passwords: `123456`.

## How Real-Time Works

1. After login, the client opens a Socket.io connection to the chat-service
   (port 3003) and emits `authenticate` with the logged-in `userId`.
2. The chat-service tracks online users (`userId -> Set<socketId>`) and
   broadcasts `user-online` / `user-offline` to everyone, so the sidebar
   shows real-time green/gray dots.
3. When a user sends a message:
   - The client POSTs to `/api/conversations/[memberId]/messages` (persists to DB).
   - On success, the client emits `message-sent` with the saved row.
   - The chat-service relays `new-message` to the recipient's sockets.
4. Typing indicator: the client emits `typing` while the user is typing;
   the chat-service relays it to the peer.
5. Read receipts: when a chat is opened, the client POSTs to
   `/api/conversations/[memberId]/read` (marks messages seen in DB) and
   emits `message-seen`; the chat-service relays `messages-seen` so the
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

- The chat-service runs on port 3003. The Caddy gateway routes
  `/?XTransformPort=3003` to it, so the client uses the relative path
  `io("/?XTransformPort=3003")` — never a direct `localhost:3003` URL.
- All API routes use relative paths and go through the same gateway.
- The Prisma schema uses `cuid()` IDs and cascade deletes, so deleting a
  user cleans up their conversations and messages.
- Passwords are hashed with `bcryptjs` (10 rounds).
