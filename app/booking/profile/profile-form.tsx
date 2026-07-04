"use client"

import { useState } from "react"
import { updateUser } from "@/app/actions/user"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { APP_CONFIG } from "@/lib/config"

export function ProfileForm({ user }: { user: { id: string, name: string, email: string, team: string | null, role: string } }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      await updateUser(user.id, formData)
      toast.success("Profile updated successfully")
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input name="name" defaultValue={user.name} required />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input name="email" type="email" defaultValue={user.email} required />
          </div>
          <div className="space-y-2">
            <Label>Team</Label>
            {user.role === "ADMIN" || user.role === "SUPERADMIN" ? (
              <Select name="team" defaultValue={user.team || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {APP_CONFIG.PREDEFINED_TEAMS.map(team => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input name="team" value={user.team || "No team assigned"} disabled />
            )}
          </div>
          <div className="space-y-2">
            <Label>New Password (Optional)</Label>
            <Input name="password" type="password" minLength={6} placeholder="Leave blank to keep current password" />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
