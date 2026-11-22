'use client'

import { io, Socket } from 'socket.io-client'

const SOCKET_PORT = 3003

let socket: Socket | null = null

/**
 * Singleton Socket.io client. Connects through the Caddy gateway
 * via the XTransformPort query parameter (path "/"), which Caddy
 * routes to the chat-service mini-service on port 3003.
 */
export function getSocket(): Socket {
  if (typeof window === 'undefined') {
    throw new Error('getSocket() can only be called in the browser')
  }
  if (!socket) {
    socket = io(`/?XTransformPort=${SOCKET_PORT}`, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    })
  }
  return socket
}
