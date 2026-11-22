import { getCurrentUser } from '@/lib/auth'
import { getUsers, getUnreadCounts, seedIfEmpty } from '@/lib/store'
import { LoginForm } from '@/components/messenger/login-form'
import { ChatAppShell } from '@/components/messenger/chat-app-shell'

export const dynamic = 'force-dynamic'

export default async function Home() {
  await seedIfEmpty()
  const me = await getCurrentUser()

  if (!me) {
    const users = getUsers()
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
      .map((u) => ({ id: u.id, name: u.name, avatar: u.avatar }))
    return <LoginForm members={users} />
  }

  const others = getUsers().filter((u) => u.id !== me.id)
  const unread = getUnreadCounts(me.id)
  const initialMembers = others
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
    .map((u) => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      unreadCount: unread.get(u.id) ?? 0,
    }))

  return <ChatAppShell me={me} initialMembers={initialMembers} />
}
