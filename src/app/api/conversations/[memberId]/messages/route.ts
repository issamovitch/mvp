import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import {
  findUserById,
  getOrCreateConversation,
  createMessage,
  markMessagesSeen,
  seedIfEmpty,
} from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/conversations/[memberId]/messages
export async function GET(_req: NextRequest, ctx: { params: Promise<{ memberId: string }> }) {
  await seedIfEmpty()
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { memberId } = await ctx.params
  const other = findUserById(memberId)
  if (!other) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })

  const conv = getOrCreateConversation(me.id, memberId)

  // mark every message they sent to me as seen (opening the conversation)
  markMessagesSeen(me.id, memberId)

  return NextResponse.json({
    conversationId: conv.id,
    otherUser: { id: other.id, name: other.name, avatar: other.avatar },
    messages: conv.messages.map((m) => ({
      id: m.id,
      text: m.text,
      senderId: m.senderId,
      receiverId: m.receiverId,
      seen: m.seen,
      createdAt: m.createdAt.toISOString(),
    })),
  })
}

// POST /api/conversations/[memberId]/messages  body: { text }
export async function POST(req: NextRequest, ctx: { params: Promise<{ memberId: string }> }) {
  await seedIfEmpty()
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { memberId } = await ctx.params
  const body = await req.json().catch(() => ({} as any))
  const text = (body?.text as string | undefined)?.trim()
  if (!text) return NextResponse.json({ error: 'النص مطلوب' }, { status: 400 })

  const other = findUserById(memberId)
  if (!other) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })

  const msg = createMessage(me.id, memberId, text)

  return NextResponse.json({
    id: msg.id,
    text: msg.text,
    senderId: msg.senderId,
    receiverId: msg.receiverId,
    conversationId: msg.conversationId,
    seen: msg.seen,
    createdAt: msg.createdAt.toISOString(),
  })
}
