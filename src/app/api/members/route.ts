import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getUsers, getUnreadCounts, seedIfEmpty } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  await seedIfEmpty()
  const me = await getCurrentUser()
  if (!me) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const all = getUsers()
  const unread = getUnreadCounts(me.id)

  return NextResponse.json({
    members: all
      .filter((u) => u.id !== me.id)
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
      .map((u) => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        unreadCount: unread.get(u.id) ?? 0,
      })),
  })
}
