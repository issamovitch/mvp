'use client'

import { Avatar } from './avatar'
import { ChatMessage } from '@/store/chat-store'

function formatTime(iso: string): string {
  const d = new Date(iso)
  let h = d.getHours()
  const m = d.getMinutes()
  const ampm = h >= 12 ? 'م' : 'ص'
  h = h % 12 || 12
  return `${h}:${m < 10 ? '0' + m : m} ${ampm}`
}

interface MessageBubbleProps {
  msg: ChatMessage
  senderName: string
  senderColor: string
  showAvatar: boolean
  incoming: boolean
}

export function MessageBubble({
  msg,
  senderName,
  senderColor,
  showAvatar,
  incoming,
}: MessageBubbleProps) {
  return (
    <div
      className={
        'flex gap-2 max-w-[85%] animate-[messageIn_0.25s_ease-out] ' +
        (incoming ? 'self-start' : 'self-end flex-row-reverse')
      }
    >
      {incoming && (
        <div className={'w-7 h-7 shrink-0 self-end ' + (showAvatar ? '' : 'invisible')}>
          {showAvatar && <Avatar name={senderName} color={senderColor} size="sm" />}
        </div>
      )}
      <div className="flex flex-col gap-0.5 max-w-[220px]">
        <div
          className={
            'px-3 py-2 text-sm leading-snug break-words whitespace-pre-wrap ' +
            (incoming
              ? 'bg-[#F3F3F3] text-[#1C1E21] ' +
                (showAvatar ? 'rounded-2xl rounded-br-md' : 'rounded-2xl')
              : 'bg-[#6280EE] text-white ' +
                (showAvatar ? 'rounded-2xl rounded-bl-md' : 'rounded-2xl') +
                ' self-end')
          }
        >
          {msg.text}
        </div>
        <div
          className={
            'text-[10px] leading-none ' +
            (incoming ? 'text-[#8A8D91]' : 'text-[#8A8D91] self-end')
          }
        >
          {formatTime(msg.createdAt)}
          {!incoming && msg.seen && (
            <span className="text-[#6280EE] font-semibold mr-1"> · تمت المشاهدة</span>
          )}
        </div>
      </div>
    </div>
  )
}
