'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useChatStore } from '@/store/chat-store'

const SOCKET_PORT = 3003

/**
 * Establishes the socket.io connection and wires every inbound
 * event into the global chat store. The connection lives for the
 * lifetime of the mounted component (the whole app shell).
 */
export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const me = useChatStore((s) => s.me)
  const setOnlineUsers = useChatStore((s) => s.setOnlineUsers)
  const setUserOnline = useChatStore((s) => s.setUserOnline)
  const appendMessage = useChatStore((s) => s.appendMessage)
  const setTyping = useChatStore((s) => s.setTyping)
  const markChatSeen = useChatStore((s) => s.markChatSeen)
  const patchMemberUnread = useChatStore((s) => s.patchMemberUnread)

  useEffect(() => {
    if (!me) return
    // Caddy requires the XTransformPort query and path "/" exactly.
    const socket = io(`/?XTransformPort=${SOCKET_PORT}`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('authenticate', { userId: me.id })
    })

    const handleNewMessage = (msg: any) => {
      appendMessage({
        id: msg.id,
        text: msg.text,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        conversationId: msg.conversationId,
        seen: msg.seen ?? false,
        createdAt: msg.createdAt,
      })
      // immediately mark as seen & notify the sender (chat is open
      // or not — the store.appendMessage already incremented unread
      // when it was closed). If open, mark seen via API + socket.
      if (msg.receiverId === me.id) {
        const isOpen = useChatStore
          .getState()
          .openChats.find((c) => c.memberId === msg.senderId && !c.minimized)
        if (isOpen) {
          fetch(`/api/conversations/${msg.senderId}/read`, { method: 'POST' }).catch(() => {})
          socket.emit('message-seen', {
            byUserId: me.id,
            otherUserId: msg.senderId,
            conversationId: msg.conversationId,
          })
        }
      }
    }

    socket.on('online-users', (ids: string[]) => setOnlineUsers(ids))
    socket.on('user-online', ({ userId }: { userId: string }) => setUserOnline(userId, true))
    socket.on('user-offline', ({ userId }: { userId: string }) => setUserOnline(userId, false))
    socket.on('new-message', handleNewMessage)
    socket.on('typing', ({ fromUserId, isTyping }: { fromUserId: string; isTyping: boolean }) =>
      setTyping(fromUserId, isTyping)
    )
    socket.on('messages-seen', ({ otherUserId }: { otherUserId: string }) => {
      markChatSeen(otherUserId)
      patchMemberUnread(otherUserId, 0)
      void otherUserId
    })

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
    }
  }, [me, setOnlineUsers, setUserOnline, appendMessage, setTyping, markChatSeen, patchMemberUnread])

  return socketRef
}

export function getSocket() {
  return (window as any).__chatSocket as Socket | undefined
}
