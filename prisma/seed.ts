import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { env } from '../lib/env'

const prisma = new PrismaClient()

async function main() {
  const email = env.SUPERADMIN_EMAIL
  const password = env.SUPERADMIN_PASSWORD
  const name = env.SUPERADMIN_NAME

  if (!email || !password || !name) {
    console.warn("Skipping SuperAdmin creation: Missing SUPERADMIN credentials in .env")
    return
  }

  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'SUPERADMIN' }
  })

  if (existingAdmin) {
    console.log("SuperAdmin already exists.")
    return
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const superAdmin = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: 'SUPERADMIN',
    }
  })

  console.log(`Created SuperAdmin: ${superAdmin.email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
