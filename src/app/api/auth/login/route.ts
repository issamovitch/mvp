import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { setSessionCookie } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any))
  const name = (body?.name as string | undefined)?.trim()
  const password = body?.password as string | undefined

  if (!name || !password) {
    return NextResponse.json({ error: 'الرجاء إدخال الاسم وكلمة المرور' }, { status: 400 })
  }

  const user = await db.user.findFirst({ where: { name } })
  if (!user) {
    return NextResponse.json({ error: 'الاسم غير موجود' }, { status: 404 })
  }

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) {
    return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 })
  }

  await setSessionCookie(user.id)
  return NextResponse.json({ id: user.id, name: user.name, avatar: user.avatar })
}
