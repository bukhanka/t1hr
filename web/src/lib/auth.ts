import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
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

        // Демо-пользователи для быстрого входа
        const demoUsers = {
          'employee@company.com': {
            id: 'employee-demo',
            email: 'employee@company.com',
            name: 'Алексей Сотрудников',
            role: 'EMPLOYEE' as const,
          },
          'manager@company.com': {
            id: 'manager-demo', 
            email: 'manager@company.com',
            name: 'Мария Менеджерова',
            role: 'MANAGER' as const,
          },
          'hr@company.com': {
            id: 'hr-demo',
            email: 'hr@company.com', 
            name: 'Елена HR-специалист',
            role: 'HR' as const,
          }
        }

        // Проверяем демо-пользователей
        const demoUser = demoUsers[credentials.email as keyof typeof demoUsers]
        if (demoUser) {
          return demoUser
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
            }
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
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.role = token.role
      }

      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }

      return token
    },
  },
}
