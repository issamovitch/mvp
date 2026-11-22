'use client'

import { io, Socket } from 'socket.io-client'

const SOCKET_PORT = 3003

let socket: Socket | null = null

/**
 * Singleton Socket.io client.
 *
 * On the deployment platform, connects via Caddy gateway:
 *   io("/?XTransformPort=3003")
 *
 * When running locally (localhost / 127.0.0.1), connects directly:
 *   io("http://localhost:3003")
 */
export function getSocket(): Socket {
  if (typeof window === 'undefined') {
    throw new Error('getSocket() can only be called in the browser')
  }
  if (!socket) {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'

    const url = isLocal
      ? `http://localhost:${SOCKET_PORT}`
      : `/?XTransformPort=${SOCKET_PORT}`

    socket = io(url, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    })
  }
  return socket
}
