import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { markMessagesSeen, seedIfEmpty } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/conversations/[memberId]/read
// Marks every message sent by `memberId` to the current user as seen.
export async function POST(_req: NextRequest, ctx: { params: Promise<{ memberId: string }> }) {
  await seedIfEmpty()
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { memberId } = await ctx.params
  const updated = markMessagesSeen(me.id, memberId)
  return NextResponse.json({ ok: true, updated })
}
