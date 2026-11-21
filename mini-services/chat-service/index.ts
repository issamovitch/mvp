import { createServer } from 'http'
import { Server } from 'socket.io'

// =========================================================
// Chat micro-service (Socket.io)
// ---------------------------------------------------------
// Responsibilities:
//   * Authenticate sockets against a userId (passed by the
//     client after the Next.js cookie login).
//   * Track online users (userId -> Set<socketId>).
//   * Relay the following events between two users:
//       - message-sent  -> new-message      (delivery)
//       - typing        -> typing           (typing indicator)
//       - message-seen  -> messages-seen    (read receipts)
//   * Broadcast presence (user-online / user-offline) so the
//     members sidebar shows real-time green / gray dots.
// Everything else (DB persistence, history, unread counts) is
// handled by the Next.js API routes — this service is just a
// real-time relay.
// =========================================================

const PORT = 3003

const httpServer = createServer()
const io = new Server(httpServer, {
  // Caddy forwards `/?XTransformPort=3003` to this service, so the
  // path must stay "/" exactly.
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// userId -> Set<socketId>
const onlineUsers = new Map<string, Set<string>>()

function userOnline(userId: string) {
  return onlineUsers.has(userId) && (onlineUsers.get(userId)?.size ?? 0) > 0
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
  for (const sid of set) {
    io.to(sid).emit(event, payload)
  }
}

io.on('connection', (socket) => {
  let userId: string | null = null

  socket.on('authenticate', (payload: { userId: string }) => {
    if (!payload || !payload.userId) return
    const wasOnline = userId ? userOnline(userId) : false
    userId = payload.userId

    addUserSocket(userId, socket.id)
    socket.join(`user:${userId}`)

    if (!wasOnline) {
      // tell everyone this user is now online
      io.emit('user-online', { userId })
    }
    // send this socket the current list of online users
    socket.emit('online-users', Array.from(onlineUsers.keys()))
  })

  // sender emitted a message; relay to the recipient
  socket.on('message-sent', (payload: {
    id: string
    text: string
    senderId: string
    receiverId: string
    conversationId: string
    createdAt: string
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

  // client asks for the current online list (e.g. on reconnect)
  socket.on('get-online-users', () => {
    socket.emit('online-users', Array.from(onlineUsers.keys()))
  })

  socket.on('disconnect', () => {
    if (!userId) return
    removeUserSocket(userId, socket.id)
    if (!userOnline(userId)) {
      io.emit('user-offline', { userId })
    }
  })

  socket.on('error', (err) => {
    console.error(`[chat-service] socket error ${socket.id}:`, err)
  })
})

httpServer.listen(PORT, () => {
  console.log(`[chat-service] Socket.io server running on port ${PORT}`)
})

process.on('SIGTERM', () => {
  console.log('[chat-service] SIGTERM received, shutting down...')
  httpServer.close(() => process.exit(0))
})
process.on('SIGINT', () => {
  console.log('[chat-service] SIGINT received, shutting down...')
  httpServer.close(() => process.exit(0))
})
