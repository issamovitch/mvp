'use client'

import { useEffect } from 'react'
import { getSocket } from '@/lib/socket-client'
import { useChatStore } from '@/store/chat-store'

/**
 * Establishes the socket.io connection (shared singleton) and wires
 * every inbound event into the global chat store. The connection lives
 * for the lifetime of the mounted component (the whole app shell).
 */
export function useSocket() {
  const me = useChatStore((s) => s.me)
  const setOnlineUsers = useChatStore((s) => s.setOnlineUsers)
  const setUserOnline = useChatStore((s) => s.setUserOnline)
  const appendMessage = useChatStore((s) => s.appendMessage)
  const setTyping = useChatStore((s) => s.setTyping)
  const markChatSeen = useChatStore((s) => s.markChatSeen)
  const patchMemberUnread = useChatStore((s) => s.patchMemberUnread)

  useEffect(() => {
    if (!me) return
    const socket = getSocket()

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
      // If the chat is open, immediately mark seen and notify the sender.
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

    const onConnect = () => {
      socket.emit('authenticate', { userId: me.id })
    }

    if (socket.connected) onConnect()
    socket.on('connect', onConnect)
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
    })

    return () => {
      // Remove only our listeners — the shared socket stays connected.
      socket.off('connect', onConnect)
      socket.off('online-users')
      socket.off('user-online')
      socket.off('user-offline')
      socket.off('new-message', handleNewMessage)
      socket.off('typing')
      socket.off('messages-seen')
    }
  }, [me, setOnlineUsers, setUserOnline, appendMessage, setTyping, markChatSeen, patchMemberUnread])
}
