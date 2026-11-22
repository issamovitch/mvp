import { createServer } from 'http'
import { Server } from 'socket.io'

// =========================================================
// Chat micro-service (Socket.io) — real-time relay only.
// The platform automatically builds and starts this from
// mini-services/chat-service/. No database access; all data
// lives in the Next.js process's in-memory store.
// =========================================================

const PORT = 3003

const httpServer = createServer()
const io = new Server(httpServer, {
  // Caddy forwards `/?XTransformPort=3003` here, path must be "/".
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

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
