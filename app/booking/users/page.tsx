import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getUsers } from "@/app/actions/user"
import { UserTable } from "./user-table"

export default async function UsersPage() {
  const session = await auth()
  if (!session || session.user.role !== "SUPERADMIN") {
    redirect("/booking")
  }

  const users = await getUsers()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializedUsers = users.map((u: any) => ({
    ...u,
    createdAt: u.createdAt.toISOString()
  }))

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
      <UserTable initialUsers={serializedUsers} />
    </div>
  )
}
