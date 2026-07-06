"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional().or(z.literal("")),
  team: z.string().optional(),
  role: z.enum(["SUPERADMIN", "ADMIN", "USER"]),
})

export async function createUser(formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== "SUPERADMIN" && session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

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

  revalidatePath('/booking/users')
}

export async function updateUser(userId: string, formData: FormData) {
  const session = await auth()
  // Superadmin can update anyone, users can update themselves
  if ((session?.user?.role !== "SUPERADMIN" && session?.user?.role !== "ADMIN") && session?.user?.id !== userId) {
    throw new Error("Unauthorized")
  }

  const rawData = Object.fromEntries(formData.entries())
  const parsed = userSchema.parse(rawData)

  const dataToUpdate: Record<string, string | null | undefined> = {
    name: parsed.name,
    email: parsed.email,
    team: parsed.team,
    role: parsed.role,
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

  revalidatePath('/booking/users')
  revalidatePath('/booking/profile')
}

export async function deleteUser(userId: string) {
  const session = await auth()
  if (session?.user?.role !== "SUPERADMIN" && session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

  if (session.user.id === userId) throw new Error("Cannot delete yourself")

  await prisma.user.delete({
    where: { id: userId }
  })

  revalidatePath('/booking/users')
}

export async function getUsers() {
  const session = await auth()
  if (session?.user?.role !== "SUPERADMIN" && session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

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

export async function changeUserPassword(userId: string, newPassword: string) {
  const session = await auth()
  if (!session || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized")
  }

  if (newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters")
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  })

  revalidatePath("/booking/users")
}
