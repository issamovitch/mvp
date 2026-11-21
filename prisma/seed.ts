import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

// 6 seeded demo members. All share the password "123456".
const members = [
  { name: 'أحمد محمد',     avatar: '#E5416E' },
  { name: 'فاطمة علي',     avatar: '#6280EE' },
  { name: 'خالد العتيبي',  avatar: '#F59E0B' },
  { name: 'نورا الشمري',   avatar: '#10B981' },
  { name: 'سارة حسن',      avatar: '#8B5CF6' },
  { name: 'عمر إبراهيم',   avatar: '#EC4899' },
]

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10)

  for (const m of members) {
    const existing = await db.user.findFirst({ where: { name: m.name } })
    if (existing) {
      // keep the user, but make sure the password hash matches
      await db.user.update({ where: { id: existing.id }, data: { password: passwordHash, avatar: m.avatar } })
      console.log(`Updated member: ${m.name}`)
    } else {
      await db.user.create({ data: { name: m.name, avatar: m.avatar, password: passwordHash } })
      console.log(`Created member: ${m.name}`)
    }
  }

  const count = await db.user.count()
  console.log(`\nSeed complete. Total members in DB: ${count}`)
  console.log('All accounts use the password: 123456')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
