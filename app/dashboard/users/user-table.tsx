"use client"

import { useState } from "react"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from '@tanstack/react-table'
import { Button } from "@/components/ui/button"
import { deleteUser, createUser } from "@/app/actions/user"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { APP_CONFIG } from "@/lib/config"
import { changeUserPassword } from "@/app/actions/user"

type UserRow = {
  id: string
  name: string
  email: string
  team: string | null
  role: string
}

const columnHelper = createColumnHelper<UserRow>()

export function UserTable({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [changePasswordUserId, setChangePasswordUserId] = useState<string | null>(null)

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!changePasswordUserId) return
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await changeUserPassword(changePasswordUserId, formData.get("password") as string)
      toast.success("Password changed successfully")
      setChangePasswordUserId(null)
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to change password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return
    try {
      await deleteUser(id)
      setUsers(prev => prev.filter(u => u.id !== id))
      toast.success("User deleted successfully")
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to delete user")
    }
  }

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await createUser(formData)
      toast.success("User created successfully")
      setIsDialogOpen(false)
      // Note: in a real app, you might want to re-fetch the list here,
      // but Server Actions revalidatePath handles the SSR re-render.
      // Since this is client state, we would ideally rely on standard React Server Components.
      // For simplicity, we just reload the page to get the updated list from server.
      window.location.reload()
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to create user")
    } finally {
      setIsLoading(false)
    }
  }

  const columns = [
    columnHelper.accessor('name', { header: 'Name' }),
    columnHelper.accessor('email', { header: 'Email' }),
    columnHelper.accessor('team', { header: 'Team', cell: info => info.getValue() || '-' }),
    columnHelper.accessor('role', { 
      header: 'Role',
      cell: info => <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded">{info.getValue()}</span>
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <div className="space-x-2">
          <Button size="sm" variant="outline" onClick={() => setChangePasswordUserId(info.row.original.id)}>Change Password</Button>
          <Button size="sm" variant="destructive" onClick={() => handleDelete(info.row.original.id)}>Delete</Button>
        </div>
      ),
    }),
  ]

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger>
            <Button>Add New User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input name="name" required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input name="password" type="password" required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label>Team</Label>
                <Select name="team">
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {APP_CONFIG.PREDEFINED_TEAMS.map(team => (
                      <SelectItem key={team} value={team}>{team}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select name="role" defaultValue="USER">
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">USER</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                    <SelectItem value="SUPERADMIN">SUPERADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Creating..." : "Create User"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        
        <Dialog open={!!changePasswordUserId} onOpenChange={(open) => !open && setChangePasswordUserId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change User Password</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input name="password" type="password" required minLength={6} />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Saving..." : "Change Password"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="p-3 font-semibold text-gray-700">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="p-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
