'use client'

import { useChatStore } from '@/store/chat-store'
import { ChatWindow } from './chat-window'
import { Avatar } from './avatar'
import { StatusDot } from './status-dot'

function getMaxVisible(width: number) {
  if (width < 768) return 1
  if (width < 1100) return 2
  return 3
}

export function ChatDock() {
  const openChats = useChatStore((s) => s.openChats)
  const members = useChatStore((s) => s.members)
  const onlineUserIds = useChatStore((s) => s.onlineUserIds)
  const openChat = useChatStore((s) => s.openChat)
  const closeChat = useChatStore((s) => s.closeChat)
  const minimizeChat = useChatStore((s) => s.minimizeChat)
  const restoreChat = useChatStore((s) => s.restoreChat)

  const maxVisible = getMaxVisible(typeof window !== 'undefined' ? window.innerWidth : 1280)
  const visible = openChats.slice(0, maxVisible)
  const collapsed = openChats.slice(maxVisible)

  return (
    <div className="fixed bottom-0 right-4 flex flex-row items-end gap-3 z-40 pointer-events-none">
      {/* visible windows (newest on the right in RTL = first DOM child) */}
      {visible.map((chat) => {
        const member = members.find((m) => m.id === chat.memberId)
        if (!member) return null
        const online = onlineUserIds.has(member.id)
        return (
          <div key={chat.memberId} className="pointer-events-auto">
            <ChatWindow
              member={member}
              online={online}
              minimized={chat.minimized}
              onRestore={() => restoreChat(chat.memberId)}
              onMinimize={() => minimizeChat(chat.memberId)}
              onClose={() => closeChat(chat.memberId)}
            />
          </div>
        )
      })}

      {/* collapsed bubbles (older chats beyond maxVisible) */}
      {collapsed.map((chat) => {
        const member = members.find((m) => m.id === chat.memberId)
        if (!member) return null
        const online = onlineUserIds.has(member.id)
        const unread = member.unreadCount
        return (
          <button
            key={chat.memberId}
            type="button"
            onClick={() => openChat(chat.memberId)}
            className="pointer-events-auto relative w-13 h-13 animate-window-open"
            aria-label={`فتح محادثة ${member.name}`}
            title={member.name}
          >
            <Avatar name={member.name} color={member.avatar} size="lg" className="border-3 border-white shadow-md" />
            <StatusDot online={online} ringClass="ring-white" size="md" />
            {unread > 0 && (
              <span className="absolute -top-1 -left-1 min-w-5 h-5 px-1.5 rounded-full bg-[#E41E3F] text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white animate-[badgePop_0.25s_ease-out]">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
