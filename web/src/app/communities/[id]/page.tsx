import { Suspense } from 'react'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from '@/lib/prisma'
import { CommunityDetail } from '@/components/community-detail'
import { Loader2 } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getCommunityData(communityId: string, userId: string) {
  try {
    // Находим профиль пользователя
    const profile = await prisma.profile.findUnique({
      where: { userId }
    })

    if (!profile) return null

    // Получаем данные сообщества
    const community = await prisma.community.findFirst({
      where: {
        id: communityId,
        isActive: true,
        OR: [
          { privacy: 'PUBLIC' },
          { members: { some: { profileId: profile.id } } }
        ]
      },
      include: {
        creator: {
          include: {
            user: {
              select: { name: true, image: true }
            }
          }
        },
        members: {
          take: 10,
          include: {
            profile: {
              include: {
                user: {
                  select: { name: true, image: true }
                }
              }
            }
          },
          orderBy: { joinedAt: 'desc' }
        },
        _count: {
          select: {
            members: true,
            posts: true
          }
        }
      }
    })

    if (!community) return null

    // Проверяем членство пользователя
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_profileId: {
          communityId,
          profileId: profile.id
        }
      }
    })

    return {
      ...community,
      createdAt: community.createdAt.toISOString(),
      updatedAt: community.updatedAt.toISOString(),
      creator: {
        ...community.creator,
        user: {
          ...community.creator.user,
          name: community.creator.user.name || 'Пользователь',
          image: community.creator.user.image || undefined
        }
      },
      members: community.members.map(member => ({
        ...member,
        joinedAt: member.joinedAt.toISOString(),
        profile: {
          ...member.profile,
          user: {
            ...member.profile.user,
            name: member.profile.user.name || 'Пользователь',
            image: member.profile.user.image || undefined
          }
        }
      })),
      isMember: !!membership,
      isCreator: community.creatorId === profile.id,
      userRole: membership?.role || undefined,
      userProfile: profile
    }
  } catch (error) {
    console.error('Error fetching community:', error)
    return null
  }
}

export default async function CommunityPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  const { id } = await params
  
  if (!session) {
    redirect("/auth/signin")
  }

  const communityData = await getCommunityData(id, session.user.id)

  if (!communityData) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Suspense fallback={
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Загружаем сообщество...</span>
        </div>
      }>
        <CommunityDetail
          community={communityData}
          currentUser={{
            name: session.user.name || 'Пользователь',
            image: session.user.image || undefined
          }}
        />
      </Suspense>
    </div>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  
  try {
    const community = await prisma.community.findUnique({
      where: { id },
      select: { name: true, description: true }
    })

    if (!community) {
      return {
        title: 'Сообщество не найдено',
        description: 'Запрошенное сообщество не существует'
      }
    }

    return {
      title: `${community.name} | T1 Сообщества`,
      description: community.description
    }
  } catch (error) {
    return {
      title: 'Сообщество',
      description: 'Корпоративные сообщества T1'
    }
  }
}
