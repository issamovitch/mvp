import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { seedIfEmpty } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  await seedIfEmpty()
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 })
  }
  return NextResponse.json({ user })
}
