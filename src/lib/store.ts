import bcrypt from 'bcryptjs'

// =========================================================
// In-memory data store (no database).
// All state lives in process memory and is reset on restart.
// The 6 demo members are seeded on first import.
// =========================================================

export interface User {
  id: string
  name: string
  avatar: string
  password: string // bcrypt hash
  createdAt: Date
}

export interface Message {
  id: string
  text: string
  senderId: string
  receiverId: string
  conversationId: string
  seen: boolean
  createdAt: Date
}

export interface Conversation {
  id: string
  userAId: string // the smaller id
  userBId: string // the larger id
  createdAt: Date
  messages: Message[]
}

interface StoreState {
  users: Map<string, User>
  conversations: Map<string, Conversation>
  convKeyMap: Map<string, string> // "minId_maxId" -> conversationId
  initialized: boolean
}

// Attach to globalThis so the store survives Next.js dev HMR re-evaluation.
const g = globalThis as unknown as { __chatStore?: StoreState }
if (!g.__chatStore) {
  g.__chatStore = {
    users: new Map(),
    conversations: new Map(),
    convKeyMap: new Map(),
    initialized: false,
  }
}
const state = g.__chatStore

function makeId(): string {
  return 'id_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function convKey(a: string, b: string): string {
  return [a, b].sort().join('_')
}

const SEED_MEMBERS = [
  { name: 'أحمد محمد', avatar: '#E5416E' },
  { name: 'فاطمة علي', avatar: '#6280EE' },
  { name: 'خالد العتيبي', avatar: '#F59E0B' },
  { name: 'نورا الشمري', avatar: '#10B981' },
  { name: 'سارة حسن', avatar: '#8B5CF6' },
  { name: 'عمر إبراهيم', avatar: '#EC4899' },
]

export async function seedIfEmpty(): Promise<void> {
  if (state.initialized) return
  state.initialized = true
  const passwordHash = await bcrypt.hash('123456', 10)
  for (const m of SEED_MEMBERS) {
    const id = makeId()
    state.users.set(id, {
      id,
      name: m.name,
      avatar: m.avatar,
      password: passwordHash,
      createdAt: new Date(),
    })
  }
  console.log(`[store] Seeded ${state.users.size} demo members (password: 123456)`)
}

// ----- User queries -----
export function getUsers(): User[] {
  return Array.from(state.users.values())
}

export function findUserById(id: string): User | null {
  return state.users.get(id) ?? null
}

export function findUserByName(name: string): User | null {
  for (const u of state.users.values()) {
    if (u.name === name) return u
  }
  return null
}

// ----- Conversation queries -----
export function getOrCreateConversation(userAId: string, userBId: string): Conversation {
  const key = convKey(userAId, userBId)
  const existingId = state.convKeyMap.get(key)
  if (existingId) {
    const conv = state.conversations.get(existingId)
    if (conv) return conv
  }
  const id = makeId()
  const [a, b] = userAId < userBId ? [userAId, userBId] : [userBId, userAId]
  const conv: Conversation = {
    id,
    userAId: a,
    userBId: b,
    createdAt: new Date(),
    messages: [],
  }
  state.conversations.set(id, conv)
  state.convKeyMap.set(key, id)
  return conv
}

// ----- Message queries -----
export function createMessage(senderId: string, receiverId: string, text: string): Message {
  const conv = getOrCreateConversation(senderId, receiverId)
  const msg: Message = {
    id: makeId(),
    text,
    senderId,
    receiverId,
    conversationId: conv.id,
    seen: false,
    createdAt: new Date(),
  }
  conv.messages.push(msg)
  return msg
}

export function markMessagesSeen(seenByUserId: string, otherUserId: string): number {
  const conv = getOrCreateConversation(seenByUserId, otherUserId)
  let count = 0
  for (const msg of conv.messages) {
    if (msg.senderId === otherUserId && !msg.seen) {
      msg.seen = true
      count++
    }
  }
  return count
}

export function getUnreadCounts(forUserId: string): Map<string, number> {
  const result = new Map<string, number>()
  for (const conv of state.conversations.values()) {
    for (const msg of conv.messages) {
      if (msg.receiverId === forUserId && !msg.seen) {
        result.set(msg.senderId, (result.get(msg.senderId) ?? 0) + 1)
      }
    }
  }
  return result
}
