import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const me = await getCurrentUser()
  if (!me) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  // list every other member, plus their unread count toward me
  const users = await db.user.findMany({
    where: { id: { not: me.id } },
    orderBy: { name: 'asc' },
  })

  // count unread messages (sender = member, receiver = me, seen = false)
  const unread = await db.message.groupBy({
    by: ['senderId'],
    where: { receiverId: me.id, seen: false },
    _count: { _all: true },
  })
  const unreadMap = new Map(unread.map((u) => [u.senderId, u._count._all]))

  return NextResponse.json({
    members: users.map((u) => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      unreadCount: unreadMap.get(u.id) ?? 0,
    })),
  })
}
