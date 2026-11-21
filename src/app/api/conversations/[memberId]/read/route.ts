import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/conversations/[memberId]/read
// Marks every message sent by `memberId` to the current user as seen.
export async function POST(_req: NextRequest, ctx: { params: Promise<{ memberId: string }> }) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { memberId } = await ctx.params
  const [a, b] = me.id < memberId ? [me.id, memberId] : [memberId, me.id]
  const conv = await db.conversation.findUnique({
    where: { userAId_userBId: { userAId: a, userBId: b } },
  })
  if (!conv) return NextResponse.json({ ok: true, updated: 0 })

  const result = await db.message.updateMany({
    where: { conversationId: conv.id, senderId: memberId, seen: false },
    data: { seen: true },
  })

  return NextResponse.json({ ok: true, updated: result.count })
}
