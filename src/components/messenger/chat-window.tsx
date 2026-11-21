'use client'

import { useEffect, useRef, useState } from 'react'
import { ChatHeader } from './chat-header'
import { ChatInput } from './chat-input'
import { MessageBubble } from './message-bubble'
import { TypingIndicator } from './typing-indicator'
import { useChatStore, Member, ChatMessage } from '@/store/chat-store'
import { io, Socket } from 'socket.io-client'

const SOCKET_PORT = 3003

interface ChatWindowProps {
  member: Member
  online: boolean
  minimized: boolean
  onRestore: () => void
  onMinimize: () => void
  onClose: () => void
}

const WINDOW_HEIGHT = 440 // px
const HEADER_HEIGHT = 48 // px

export function ChatWindow({ member, online, minimized, onRestore, onMinimize, onClose }: ChatWindowProps) {
  const me = useChatStore((s) => s.me)
  const messages = useChatStore((s) => s.openChats.find((c) => c.memberId === member.id)?.messages ?? [])
  const typing = useChatStore((s) => s.openChats.find((c) => c.memberId === member.id)?.typing ?? false)
  const setChatMessages = useChatStore((s) => s.setChatMessages)
  const appendMessage = useChatStore((s) => s.appendMessage)
  const markChatSeen = useChatStore((s) => s.markChatSeen)

  const bodyRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const [loaded, setLoaded] = useState(false)

  // Load history once when the window mounts
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/conversations/${member.id}/messages`, { cache: 'no-store' })
        const data = await res.json()
        if (cancelled || !data?.messages) return
        setChatMessages(member.id, data.messages as ChatMessage[])
        // mark seen locally for my own messages (they were already seen by the act of opening)
        markChatSeen(member.id)
      } finally {
        setLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [member.id, setChatMessages, markChatSeen])

  // Get a shared socket for sending typing / message-seen events
  useEffect(() => {
    const socket = io(`/?XTransformPort=${SOCKET_PORT}`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })
    socketRef.current = socket
    socket.on('connect', () => {
      if (me) socket.emit('authenticate', { userId: me.id })
    })
    return () => {
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [me])

  // Auto-scroll to bottom whenever messages or typing change
  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, typing, minimized])

  const handleSend = async (text: string) => {
    if (!me) return
    // optimistic local append
    const optimistic: ChatMessage = {
      id: 'optimistic_' + Date.now(),
      text,
      senderId: me.id,
      receiverId: member.id,
      seen: false,
      createdAt: new Date().toISOString(),
    }
    appendMessage(optimistic)

    try {
      const res = await fetch(`/api/conversations/${member.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const saved = await res.json()
      if (!saved?.id) return
      // replace optimistic with the persisted row, preserving any
      // seen-status update that may have arrived in the meantime
      setChatMessages(
        member.id,
        useChatStore
          .getState()
          .openChats.find((c) => c.memberId === member.id)!
          .messages.map((m) =>
            m.id === optimistic.id ? { ...saved, seen: m.seen } : m
          )
      )
      // relay to recipient in real-time
      socketRef.current?.emit('message-sent', saved)
    } catch {
      // leave optimistic in place on failure; could mark as failed
    }
  }

  const handleTyping = (isTyping: boolean) => {
    if (!me) return
    socketRef.current?.emit('typing', {
      toUserId: member.id,
      fromUserId: me.id,
      isTyping,
    })
  }

  // Compute grouping: first message of a run shows the avatar
  const renderRows: { msg: ChatMessage; showAvatar: boolean; incoming: boolean }[] = []
  let prev: ChatMessage | null = null
  for (const m of messages) {
    const incoming = m.senderId !== me?.id
    const showAvatar =
      !prev ||
      prev.senderId !== m.senderId ||
      new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60 * 1000
    renderRows.push({ msg: m, showAvatar, incoming })
    prev = m
  }

  return (
    <div
      className={
        'fixed md:relative bottom-0 right-0 left-0 md:left-auto md:right-auto ' +
        'w-full md:w-[340px] bg-white md:rounded-t-xl rounded-none shadow-[0_8px_28px_rgba(0,0,0,0.18)] ' +
        'flex flex-col overflow-hidden animate-window-open ' +
        (minimized
          ? 'md:h-12 h-12'
          : 'h-[100dvh] md:h-[440px] animate-mobile-slide md:animate-window-open')
      }
      style={{
        transition: 'height 0.25s ease',
      }}
    >
      <ChatHeader
        member={member}
        online={online}
        minimized={minimized}
        onRestore={onRestore}
        onMinimize={onMinimize}
        onClose={onClose}
      />

      {!minimized && (
        <>
          <div
            ref={bodyRef}
            className="chat-scroll flex-1 overflow-y-auto px-2.5 py-3.5 bg-white flex flex-col gap-1"
          >
            {loaded && messages.length === 0 && (
              <div className="m-auto text-center text-[#8A8D91] text-xs px-5 py-4">
                <div
                  className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: member.avatar }}
                >
                  {member.name.charAt(0)}
                </div>
                ابدأ المحادثة مع {member.name}
              </div>
            )}
            {renderRows.map(({ msg, showAvatar, incoming }) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                senderName={member.name}
                senderColor={member.avatar}
                showAvatar={showAvatar}
                incoming={incoming}
              />
            ))}
            {typing && <TypingIndicator name={member.name} color={member.avatar} />}
          </div>
          <div className="border-t border-[#E4E6EB]">
            <ChatInput onSend={handleSend} onTyping={handleTyping} />
          </div>
        </>
      )}
    </div>
  )
}
