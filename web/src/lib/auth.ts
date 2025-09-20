import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "john@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null
        }

        // Демо-пользователи из seed данных для быстрого входа
        const quickLoginEmails = [
          'ivan.petrov@company.com', // Employee
          'elena.sidorova@company.com', // Employee  
          'svetlana.manager@company.com', // Manager
          'ekaterina.hr@company.com' // HR
        ]

        // Если это один из быстрых логинов, ищем пользователя в базе
        if (quickLoginEmails.includes(credentials.email)) {
          try {
            const user = await prisma.user.findUnique({
              where: { email: credentials.email }
            })
            if (user) {
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
              } as any
            }
          } catch (error) {
            console.log('Database connection error for quick login')
          }
        }

        // Если не демо-пользователь, пытаемся найти в базе
        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          })

          if (user) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            } as any
          }
        } catch (error) {
          console.log('Database connection error, using demo mode')
        }

        return null
      },
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.role = token.role
      }

      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }

      return token
    },
  },
}
