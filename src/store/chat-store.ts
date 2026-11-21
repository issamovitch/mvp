'use client'

import { create } from 'zustand'

export interface ChatMessage {
  id: string
  text: string
  senderId: string
  receiverId: string
  conversationId?: string
  seen: boolean
  createdAt: string
}

export interface Member {
  id: string
  name: string
  avatar: string
  unreadCount: number
}

interface OpenChat {
  memberId: string
  minimized: boolean
  messages: ChatMessage[]
  typing: boolean
}

interface ChatState {
  me: { id: string; name: string; avatar: string } | null
  members: Member[]
  onlineUserIds: Set<string>
  openChats: OpenChat[]

  setMe: (me: ChatState['me']) => void
  setMembers: (m: Member[]) => void
  patchMemberUnread: (memberId: string, delta: number) => void
  setMemberUnread: (memberId: string, count: number) => void
  setOnlineUsers: (ids: string[]) => void
  setUserOnline: (id: string, online: boolean) => void

  openChat: (memberId: string) => void
  closeChat: (memberId: string) => void
  minimizeChat: (memberId: string) => void
  restoreChat: (memberId: string) => void
  setChatMessages: (memberId: string, messages: ChatMessage[]) => void
  appendMessage: (msg: ChatMessage) => void
  setTyping: (memberId: string, typing: boolean) => void
  markChatSeen: (memberId: string) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  me: null,
  members: [],
  onlineUserIds: new Set(),
  openChats: [],

  setMe: (me) => set({ me }),
  setMembers: (members) => set({ members }),
  patchMemberUnread: (memberId, delta) =>
    set((s) => ({
      members: s.members.map((m) =>
        m.id === memberId
          ? { ...m, unreadCount: Math.max(0, m.unreadCount + delta) }
          : m
      ),
    })),
  setMemberUnread: (memberId, count) =>
    set((s) => ({
      members: s.members.map((m) =>
        m.id === memberId ? { ...m, unreadCount: count } : m
      ),
    })),
  setOnlineUsers: (ids) => set({ onlineUserIds: new Set(ids) }),
  setUserOnline: (id, online) =>
    set((s) => {
      const next = new Set(s.onlineUserIds)
      if (online) next.add(id)
      else next.delete(id)
      return { onlineUserIds: next }
    }),

  openChat: (memberId) =>
    set((s) => {
      const existing = s.openChats.find((c) => c.memberId === memberId)
      if (existing) {
        return {
          openChats: [
            { ...existing, minimized: false },
            ...s.openChats.filter((c) => c.memberId !== memberId),
          ],
          members: s.members.map((m) =>
            m.id === memberId ? { ...m, unreadCount: 0 } : m
          ),
        }
      }
      return {
        openChats: [{ memberId, minimized: false, messages: [], typing: false }, ...s.openChats],
        members: s.members.map((m) =>
          m.id === memberId ? { ...m, unreadCount: 0 } : m
        ),
      }
    }),

  closeChat: (memberId) =>
    set((s) => ({ openChats: s.openChats.filter((c) => c.memberId !== memberId) })),

  minimizeChat: (memberId) =>
    set((s) => ({
      openChats: s.openChats.map((c) =>
        c.memberId === memberId ? { ...c, minimized: true } : c
      ),
    })),

  restoreChat: (memberId) =>
    set((s) => {
      const chat = s.openChats.find((c) => c.memberId === memberId)
      if (!chat) return {}
      return {
        openChats: [
          { ...chat, minimized: false },
          ...s.openChats.filter((c) => c.memberId !== memberId),
        ],
        members: s.members.map((m) =>
          m.id === memberId ? { ...m, unreadCount: 0 } : m
        ),
      }
    }),

  setChatMessages: (memberId, messages) =>
    set((s) => ({
      openChats: s.openChats.map((c) =>
        c.memberId === memberId ? { ...c, messages } : c
      ),
    })),

  appendMessage: (msg) =>
    set((s) => {
      const meId = s.me?.id
      const peerId = msg.senderId === meId ? msg.receiverId : msg.senderId
      const chat = s.openChats.find((c) => c.memberId === peerId)
      if (chat && !chat.minimized) {
        return {
          openChats: s.openChats.map((c) =>
            c.memberId === peerId
              ? { ...c, messages: [...c.messages, msg] }
              : c
          ),
        }
      }
      if (msg.receiverId === meId) {
        return {
          members: s.members.map((m) =>
            m.id === msg.senderId
              ? { ...m, unreadCount: m.unreadCount + 1 }
              : m
          ),
        }
      }
      return {}
    }),

  setTyping: (memberId, typing) =>
    set((s) => ({
      openChats: s.openChats.map((c) =>
        c.memberId === memberId ? { ...c, typing } : c
      ),
    })),

  markChatSeen: (memberId) =>
    set((s) => ({
      openChats: s.openChats.map((c) =>
        c.memberId === memberId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.senderId === s.me?.id ? { ...m, seen: true } : m
              ),
            }
          : c
      ),
    })),
}))
