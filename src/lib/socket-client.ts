'use client'

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

/**
 * Singleton Socket.io client. Connects to the same origin (the Next.js
 * custom server hosts both the app and Socket.io on a single port), so
 * no XTransformPort is needed.
 */
export function getSocket(): Socket {
  if (typeof window === 'undefined') {
    throw new Error('getSocket() can only be called in the browser')
  }
  if (!socket) {
    socket = io({
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    })
  }
  return socket
}
