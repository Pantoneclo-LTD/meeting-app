"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  team: z.string().optional(),
  role: z.enum(["SUPERADMIN", "ADMIN", "USER"]),
})

export async function createUser(formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== "SUPERADMIN") throw new Error("Unauthorized")

  const rawData = Object.fromEntries(formData.entries())
  const parsed = userSchema.parse(rawData)

  if (!parsed.password) throw new Error("Password is required for new users")

  const hashedPassword = await bcrypt.hash(parsed.password, 10)

  await prisma.user.create({
    data: {
      name: parsed.name,
      email: parsed.email,
      password: hashedPassword,
      team: parsed.team,
      role: parsed.role,
    }
  })

  revalidatePath('/dashboard/users')
}

export async function updateUser(userId: string, formData: FormData) {
  const session = await auth()
  // Superadmin can update anyone, users can update themselves
  if (session?.user?.role !== "SUPERADMIN" && session?.user?.id !== userId) {
    throw new Error("Unauthorized")
  }

  const rawData = Object.fromEntries(formData.entries())
  const parsed = userSchema.omit({ role: true }).parse(rawData)

  const dataToUpdate: Record<string, string | null | undefined> = {
    name: parsed.name,
    email: parsed.email,
    team: parsed.team,
  }

  if (session?.user?.role === "SUPERADMIN") {
    dataToUpdate.role = rawData.role as string
  }

  if (parsed.password) {
    dataToUpdate.password = await bcrypt.hash(parsed.password, 10)
  }

  await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate
  })

  revalidatePath('/dashboard/users')
  revalidatePath('/dashboard/profile')
}

export async function deleteUser(userId: string) {
  const session = await auth()
  if (session?.user?.role !== "SUPERADMIN") throw new Error("Unauthorized")

  if (session.user.id === userId) throw new Error("Cannot delete yourself")

  await prisma.user.delete({
    where: { id: userId }
  })

  revalidatePath('/dashboard/users')
}

export async function getUsers() {
  const session = await auth()
  if (session?.user?.role !== "SUPERADMIN") throw new Error("Unauthorized")
  
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      team: true,
      role: true,
      createdAt: true
    }
  })
}
