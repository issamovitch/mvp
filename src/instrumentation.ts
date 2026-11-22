// Next.js instrumentation hook — runs on server startup (both dev and production).
// We use it to start the Socket.io chat server on port 3003 within the same
// Node.js process as Next.js, so a single `next dev` / `next start` runs
// everything. No custom server, no separate process, no background tasks.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startChatServer } = await import('./lib/chat-server')
    startChatServer()
  }
}
