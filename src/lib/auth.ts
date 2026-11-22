import { cookies } from 'next/headers'
import { findUserById } from './store'

export const SESSION_COOKIE = 'messenger_session'

export interface SessionUser {
  id: string
  name: string
  avatar: string
}

/**
 * Read the current user from the session cookie.
 * Returns null when not logged in.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const userId = store.get(SESSION_COOKIE)?.value
  if (!userId) return null
  const user = findUserById(userId)
  if (!user) return null
  return { id: user.id, name: user.name, avatar: user.avatar }
}

export async function setSessionCookie(userId: string) {
  const store = await cookies()
  store.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  })
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}
