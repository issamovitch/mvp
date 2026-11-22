import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { seedIfEmpty } from './src/lib/store'

// =========================================================
// Custom Next.js server with Socket.io attached.
// A single `bun server.ts` (or `npm run dev`) starts both the
// Next.js app and the real-time chat service on one port.
// =========================================================

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT || '3000', 10)

async function main() {
  // Seed the in-memory store before anything else runs.
  await seedIfEmpty()

  const app = next({ dev })
  const handle = app.getRequestHandler()
  await app.prepare()

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url || '/', true)
    handle(req, res, parsedUrl)
  })

  // Attach Socket.io to the same HTTP server. It intercepts
  // /socket.io/* requests automatically; everything else goes
  // to the Next.js handler above.
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  // ---------- presence + event relay ----------
  const onlineUsers = new Map<string, Set<string>>()

  function userOnline(userId: string) {
    const set = onlineUsers.get(userId)
    return !!set && set.size > 0
  }
  function addUserSocket(userId: string, socketId: string) {
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set())
    onlineUsers.get(userId)!.add(socketId)
  }
  function removeUserSocket(userId: string, socketId: string) {
    const set = onlineUsers.get(userId)
    if (!set) return
    set.delete(socketId)
    if (set.size === 0) onlineUsers.delete(userId)
  }
  function emitToUser(userId: string, event: string, payload: any) {
    const set = onlineUsers.get(userId)
    if (!set) return
    for (const sid of set) io.to(sid).emit(event, payload)
  }

  io.on('connection', (socket) => {
    let userId: string | null = null

    socket.on('authenticate', (payload: { userId: string }) => {
      if (!payload || !payload.userId) return
      const wasOnline = userId ? userOnline(userId) : false
      userId = payload.userId
      addUserSocket(userId, socket.id)
      socket.join(`user:${userId}`)
      if (!wasOnline) io.emit('user-online', { userId })
      socket.emit('online-users', Array.from(onlineUsers.keys()))
    })

    socket.on('message-sent', (payload: {
      id: string; text: string; senderId: string; receiverId: string
      conversationId: string; createdAt: string
    }) => {
      if (!userId || userId !== payload.senderId) return
      emitToUser(payload.receiverId, 'new-message', payload)
    })

    socket.on('typing', (payload: { toUserId: string; fromUserId: string; isTyping: boolean }) => {
      if (!userId || userId !== payload.fromUserId) return
      emitToUser(payload.toUserId, 'typing', payload)
    })

    socket.on('message-seen', (payload: { byUserId: string; otherUserId: string; conversationId: string }) => {
      if (!userId || userId !== payload.byUserId) return
      emitToUser(payload.otherUserId, 'messages-seen', payload)
    })

    socket.on('get-online-users', () => {
      socket.emit('online-users', Array.from(onlineUsers.keys()))
    })

    socket.on('disconnect', () => {
      if (!userId) return
      removeUserSocket(userId, socket.id)
      if (!userOnline(userId)) io.emit('user-offline', { userId })
    })

    socket.on('error', (err) => {
      console.error('[socket] error', socket.id, err)
    })
  })

  httpServer.listen(port, () => {
    console.log(`\n  ▲ موقعنا — Messenger MVP`)
    console.log(`  - Local:        http://localhost:${port}`)
    console.log(`  - Socket.io:    ws://localhost:${port}/socket.io`)
    console.log(`  - Mode:         ${dev ? 'development' : 'production'}\n`)
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
