import { Role } from "@prisma/client"
import type { User } from "next-auth"
import type { JWT } from "next-auth/jwt"

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
  }
}

declare module "next-auth" {
  interface Session {
    user: User & {
      id: string
      role: Role
    }
  }

  interface User {
    role: Role
  }
}
