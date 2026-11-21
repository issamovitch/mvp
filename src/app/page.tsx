import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { LoginForm } from '@/components/messenger/login-form'
import { ChatAppShell } from '@/components/messenger/chat-app-shell'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const me = await getCurrentUser()

  if (!me) {
    // list available members for the quick-fill buttons
    const users = await db.user.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, avatar: true },
    })
    return <LoginForm members={users} />
  }

  // build the initial members payload (everyone except me + unread counts)
  const others = await db.user.findMany({
    where: { id: { not: me.id } },
    orderBy: { name: 'asc' },
  })
  const unread = await db.message.groupBy({
    by: ['senderId'],
    where: { receiverId: me.id, seen: false },
    _count: { _all: true },
  })
  const unreadMap = new Map(unread.map((u) => [u.senderId, u._count._all]))
  const initialMembers = others.map((u) => ({
    id: u.id,
    name: u.name,
    avatar: u.avatar,
    unreadCount: unreadMap.get(u.id) ?? 0,
  }))

  return <ChatAppShell me={me} initialMembers={initialMembers} />
}
