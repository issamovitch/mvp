'use client'

import { useRef, useState, FormEvent } from 'react'
import { Send } from 'lucide-react'

interface ChatInputProps {
  onSend: (text: string) => void
  onTyping?: (typing: boolean) => void
}

export function ChatInput({ onSend, onTyping }: ChatInputProps) {
  const [value, setValue] = useState('')
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const text = value.trim()
    if (!text) return
    onSend(text)
    setValue('')
    if (onTyping) {
      clearTimeout(typingTimerRef.current)
      onTyping(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    if (onTyping) {
      onTyping(true)
      clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => onTyping(false), 1500)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex items-center gap-1 bg-white border border-[#E4E6EB] rounded-full px-1 py-0.5 mx-2.5 my-2 transition focus-within:border-[#6280EE]"
    >
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="اكتب رسالة..."
        autoComplete="off"
        className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm px-3 py-2 text-[#1C1E21] placeholder:text-[#8A8D91]"
      />
      <button
        type="submit"
        className="w-8 h-8 shrink-0 rounded-full bg-[#6280EE] text-white flex items-center justify-center hover:bg-[#4F6BE0] active:scale-95 transition"
        aria-label="إرسال"
        title="إرسال"
      >
        {/* mirrored paper plane for RTL */}
        <Send className="w-4 h-4 -scale-x-100" />
      </button>
    </form>
  )
}
