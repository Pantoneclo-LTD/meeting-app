import NextAuth, { type DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "SUPERADMIN" | "ADMIN" | "USER"
      team?: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: "SUPERADMIN" | "ADMIN" | "USER"
    team?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "SUPERADMIN" | "ADMIN" | "USER"
    team?: string | null
  }
}
