'use client'

import { useEffect } from 'react'
import { useChatStore } from '@/store/chat-store'
import { useSocket } from '@/hooks/use-socket'
import { MembersSidebar } from './members-sidebar'
import { ChatDock } from './chat-dock'
import { Avatar } from './avatar'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ChatAppShellProps {
  me: { id: string; name: string; avatar: string }
  initialMembers: { id: string; name: string; avatar: string; unreadCount: number }[]
}

export function ChatAppShell({ me, initialMembers }: ChatAppShellProps) {
  const router = useRouter()
  const setMe = useChatStore((s) => s.setMe)
  const setMembers = useChatStore((s) => s.setMembers)
  useSocket() // sets up socket connection + event handlers

  useEffect(() => {
    setMe(me)
    setMembers(initialMembers)
  }, [me, initialMembers, setMe, setMembers])

  // Poll members every 12s as a backstop for unread/online sync
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch('/api/members', { cache: 'no-store' })
        const data = await res.json()
        if (data?.members) setMembers(data.members)
      } catch {}
    }, 12000)
    return () => clearInterval(id)
  }, [setMembers])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Site header */}
      <header className="h-15 bg-white border-b border-[#E4E6EB] sticky top-0 z-30 px-5 flex items-center" style={{ height: 60 }}>
        <div className="text-2xl font-extrabold text-[#6280EE] me-auto">موقعنا</div>
        <nav className="hidden sm:flex gap-5 me-6">
          <a href="#" className="text-[15px] font-medium text-[#65676B] hover:text-[#6280EE]">الرئيسية</a>
          <a href="#" className="text-[15px] font-medium text-[#65676B] hover:text-[#6280EE]">الأعضاء</a>
          <a href="#" className="text-[15px] font-medium text-[#65676B] hover:text-[#6280EE]">المجموعات</a>
          <a href="#" className="text-[15px] font-medium text-[#65676B] hover:text-[#6280EE]">الفعاليات</a>
          <a href="#" className="text-[15px] font-medium text-[#65676B] hover:text-[#6280EE]">حول</a>
        </nav>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#F0F2F5] rounded-full px-3.5 py-1.5">
            <Avatar name={me.name} color={me.avatar} size="sm" />
            <span className="text-sm font-semibold text-[#1C1E21] hidden sm:inline">{me.name}</span>
          </div>
          <button
            type="button"
            onClick={logout}
            title="تسجيل الخروج"
            className="w-9 h-9 rounded-full bg-[#F0F2F5] hover:bg-[#E4E6EB] flex items-center justify-center text-[#65676B]"
          >
            <LogOut className="w-4 h-4 -scale-x-100" />
          </button>
        </div>
      </header>

      {/* Main layout: content + sidebar */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid gap-6 grid-cols-1 md:grid-cols-[1fr_300px]">
        <section className="min-w-0">
          <div className="bg-gradient-to-br from-[#6280EE] to-[#4F6BE0] text-white rounded-2xl p-9 mb-5 shadow-md">
            <h1 className="text-3xl font-extrabold mb-3">أهلاً بك في موقعنا</h1>
            <p className="text-base leading-relaxed opacity-95">
              منصة تجمع الأعضاء للنقاش والمشاركة. تواصل مع الأعضاء الآخرين عبر نظام المراسلة الفورية،
              وشارك أفكارك في المجموعات، وكن على اطلاع بأحدث الفعاليات.
            </p>
          </div>

          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(220px,1fr))] mb-5">
            <div className="bg-white rounded-xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
              <h3 className="text-base font-bold text-[#6280EE] mb-2">مراسلة فورية</h3>
              <p className="text-sm text-[#65676B] leading-relaxed">تحدث مع الأعضاء في الوقت الفعلي عبر نظام مراسلة بسيط وسريع.</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
              <h3 className="text-base font-bold text-[#6280EE] mb-2">مجموعات النقاش</h3>
              <p className="text-sm text-[#65676B] leading-relaxed">انضم إلى مجموعات اهتماماتك وتبادل الآراء مع بقية الأعضاء.</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
              <h3 className="text-base font-bold text-[#6280EE] mb-2">فعاليات قادمة</h3>
              <p className="text-sm text-[#65676B] leading-relaxed">كن على اطلاع بأحدث الفعاليات واللقاءات القادمة في موقعنا.</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
              <h3 className="text-base font-bold text-[#6280EE] mb-2">ملفك الشخصي</h3>
              <p className="text-sm text-[#65676B] leading-relaxed">حدّث ملفك الشخصي وشارك معلوماتك مع بقية الأعضاء.</p>
            </div>
          </div>

          <div className="bg-[#E7F0FF] rounded-xl p-4 text-sm text-[#4F6BE0] leading-relaxed font-medium">
            ابدأ بالضغط على أحد الأعضاء في لوحة "الأعضاء المتصلون" لفتح نافذة محادثة. يمكنك فتح عدة محادثات معاً وتصغيرها أو إغلاقها. افتح الموقع في تبويب آخر وسجّل الدخول كعضو مختلف لرؤية الرسائل تظهر لحظياً في كلا التبويبين عبر Socket.io.
          </div>
        </section>

        <MembersSidebar />
      </main>

      {/* Floating chat windows dock */}
      <ChatDock />
    </div>
  )
}
