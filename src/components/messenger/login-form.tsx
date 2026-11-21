'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function LoginForm({ members }: { members: { id: string; name: string; avatar: string }[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'فشل تسجيل الدخول')
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const quickFill = (n: string) => {
    setName(n)
    setPassword('123456')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#6280EE] to-[#4F6BE0]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#6280EE] text-white text-2xl font-extrabold mb-2">
            م
          </div>
          <h1 className="text-xl font-bold text-[#1C1E21]">موقعنا</h1>
          <p className="text-sm text-[#65676B] mt-1">سجّل الدخول للوصول إلى مراسلات الأعضاء</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label htmlFor="login-name" className="block text-xs font-semibold text-[#65676B] mb-1">
              الاسم
            </label>
            <input
              id="login-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أحمد محمد"
              autoComplete="off"
              required
              className="w-full bg-white border border-[#E4E6EB] rounded-lg px-3 py-2.5 text-sm focus:border-[#6280EE] outline-none"
            />
          </div>
          <div>
            <label htmlFor="login-pass" className="block text-xs font-semibold text-[#65676B] mb-1">
              كلمة المرور
            </label>
            <input
              id="login-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white border border-[#E4E6EB] rounded-lg px-3 py-2.5 text-sm focus:border-[#6280EE] outline-none"
            />
          </div>

          {error && (
            <div className="text-xs text-[#E41E3F] bg-[#FCE7EB] rounded-lg px-3 py-2">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-[#6280EE] text-white text-sm font-semibold rounded-lg py-2.5 hover:bg-[#4F6BE0] disabled:opacity-60 flex items-center justify-center gap-2 transition"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            دخول
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-[#E4E6EB]">
          <p className="text-xs text-[#65676B] mb-2">حسابات تجريبية (اضغط للملء السريع):</p>
          <div className="grid grid-cols-2 gap-1.5">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => quickFill(m.name)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-[#E4E6EB] hover:border-[#6280EE] hover:bg-[#E7F0FF]/40 transition text-right"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: m.avatar }}
                >
                  {m.name.charAt(0)}
                </div>
                <span className="text-xs truncate">{m.name}</span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[#8A8D91] mt-2">كلمة المرور لجميع الحسابات: 123456</p>
        </div>
      </div>
    </div>
  )
}
