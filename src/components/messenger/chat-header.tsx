'use client'

import { Minus, X, ChevronRight } from 'lucide-react'
import { Avatar } from './avatar'
import { StatusDot } from './status-dot'
import { Member } from '@/store/chat-store'

interface ChatHeaderProps {
  member: Member
  online: boolean
  minimized: boolean
  onRestore: () => void
  onMinimize: () => void
  onClose: () => void
}

export function ChatHeader({
  member,
  online,
  minimized,
  onRestore,
  onMinimize,
  onClose,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-2 bg-[#6280EE] text-white shrink-0 h-12">
      {/* mobile back button (hidden on md+) */}
      <button
        type="button"
        onClick={onClose}
        className="md:hidden w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition shrink-0"
        aria-label="رجوع"
        title="رجوع"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={minimized ? onRestore : undefined}
        className="relative shrink-0"
        aria-label="فتح المحادثة"
      >
        <Avatar name={member.name} color={member.avatar} size="sm" />
        <StatusDot online={online} ringClass="ring-[#6280EE]" />
      </button>
      <button
        type="button"
        onClick={minimized ? onRestore : undefined}
        className="flex-1 min-w-0 text-right"
      >
        <div className="text-sm font-bold truncate">{member.name}</div>
        <div className="text-[11px] opacity-90 truncate">
          {online ? 'متصل الآن' : 'غير متصل'}
        </div>
      </button>

      <div className="hidden md:flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onMinimize}
          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/20 transition"
          aria-label="تصغير"
          title="تصغير"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/20 transition"
          aria-label="إغلاق"
          title="إغلاق"
        >
          <X className="w-3 h-3" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
