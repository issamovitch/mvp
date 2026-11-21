'use client'

import { Avatar } from './avatar'

export function TypingIndicator({
  name,
  color,
}: {
  name: string
  color: string
}) {
  return (
    <div className="self-start flex gap-2 items-end animate-[messageIn_0.2s_ease-out]">
      <div className="w-7 h-7 shrink-0">
        <Avatar name={name} color={color} size="sm" />
      </div>
      <div className="bg-[#F3F3F3] rounded-2xl rounded-br-md px-3.5 py-3 flex gap-1 self-end">
        <span className="w-1.5 h-1.5 bg-[#8A8D91] rounded-full animate-[typingDot_1.4s_infinite]" />
        <span className="w-1.5 h-1.5 bg-[#8A8D91] rounded-full animate-[typingDot_1.4s_infinite]" style={{ animationDelay: '0.2s' }} />
        <span className="w-1.5 h-1.5 bg-[#8A8D91] rounded-full animate-[typingDot_1.4s_infinite]" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  )
}

export function TypingLabel() {
  return <span className="text-[11px] text-[#8A8D91]">يكتب الآن...</span>
}
