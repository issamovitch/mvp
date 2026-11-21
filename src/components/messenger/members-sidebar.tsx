'use client'

import { Avatar } from './avatar'
import { StatusDot } from './status-dot'
import { useChatStore } from '@/store/chat-store'

export function MembersSidebar() {
  const members = useChatStore((s) => s.members)
  const onlineUserIds = useChatStore((s) => s.onlineUserIds)
  const openChat = useChatStore((s) => s.openChat)

  return (
    <aside className="bg-white rounded-xl shadow-sm p-4 self-start sticky top-[84px]">
      <h2 className="text-[15px] font-bold text-[#1C1E21] pb-2.5 border-b border-[#E4E6EB]">
        الأعضاء المتصلون
      </h2>
      <div className="mt-1">
        {members.length === 0 && (
          <p className="text-xs text-[#8A8D91] p-3">لا يوجد أعضاء آخرون بعد.</p>
        )}
        {members.map((m) => {
          const online = onlineUserIds.has(m.id)
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => openChat(m.id)}
              className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#F0F2F5] transition text-right"
            >
              <div className="relative shrink-0">
                <Avatar name={m.name} color={m.avatar} size="md" />
                <StatusDot online={online} ringClass="ring-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{m.name}</div>
                <div className="text-[11px] text-[#8A8D91]">
                  {online ? 'متصل الآن' : 'غير متصل'}
                </div>
              </div>
              {m.unreadCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#E41E3F] text-white text-[11px] font-bold flex items-center justify-center animate-[badgePop_0.2s_ease-out]">
                  {m.unreadCount > 9 ? '9+' : m.unreadCount}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </aside>
  )
}
