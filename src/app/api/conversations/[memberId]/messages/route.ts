import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Find (or create) the 1:1 conversation between the current user
 * and the other member. Returns a normalized conversation object
 * with the messages sorted oldest-first.
 */
async function getOrCreateConversation(meId: string, otherId: string) {
  // make the pair deterministic: userAId < userBId
  const [a, b] = meId < otherId ? [meId, otherId] : [otherId, meId]

  let conv = await db.conversation.findUnique({
    where: { userAId_userBId: { userAId: a, userBId: b } },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })

  if (!conv) {
    conv = await db.conversation.create({
      data: { userAId: a, userBId: b },
      include: { messages: true },
    })
  }
  return conv
}

// GET /api/conversations/[memberId]/messages
export async function GET(_req: NextRequest, ctx: { params: Promise<{ memberId: string }> }) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { memberId } = await ctx.params
  const other = await db.user.findUnique({ where: { id: memberId } })
  if (!other) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })

  const conv = await getOrCreateConversation(me.id, memberId)

  // when opening a conversation, mark every message they sent to me as seen
  await db.message.updateMany({
    where: { conversationId: conv.id, senderId: memberId, seen: false },
    data: { seen: true },
  })

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
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { memberId } = await ctx.params
  const body = await req.json().catch(() => ({} as any))
  const text = (body?.text as string | undefined)?.trim()
  if (!text) return NextResponse.json({ error: 'النص مطلوب' }, { status: 400 })

  const other = await db.user.findUnique({ where: { id: memberId } })
  if (!other) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })

  const conv = await getOrCreateConversation(me.id, memberId)

  const msg = await db.message.create({
    data: {
      text,
      senderId: me.id,
      receiverId: memberId,
      conversationId: conv.id,
      seen: false,
    },
  })

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
