import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GamificationService } from '@/lib/gamification'
import { z } from 'zod'

const createCommunitySchema = z.object({
  name: z.string().min(3, 'Название должно быть не менее 3 символов'),
  description: z.string().min(10, 'Описание должно быть не менее 10 символов'),
  type: z.enum(['skill', 'project', 'interest', 'department']),
  tags: z.array(z.string()).max(5, 'Максимум 5 тегов'),
  privacy: z.enum(['PUBLIC', 'PRIVATE', 'INVITE_ONLY']).default('PUBLIC')
})

// Получить список сообществ
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const joined = searchParams.get('joined') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    // Находим профиль текущего пользователя
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' },
        { status: 404 }
      )
    }

    let whereClause: any = {
      isActive: true
    }

    // Фильтр по типу
    if (type && type !== 'all') {
      whereClause.type = type
    }

    // Поиск по названию и описанию
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search.toLowerCase() } }
      ]
    }

    // Только те сообщества, где пользователь состоит
    if (joined) {
      whereClause.members = {
        some: {
          profileId: profile.id
        }
      }
    }

    const communities = await prisma.community.findMany({
      where: whereClause,
      include: {
        creator: {
          include: { user: true }
        },
        members: {
          take: 5,
          include: {
            profile: {
              include: { user: true }
            }
          },
          orderBy: { joinedAt: 'desc' }
        },
        posts: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              include: { user: true }
            }
          }
        },
        _count: {
          select: {
            members: true,
            posts: true
          }
        }
      },
      orderBy: [
        { memberCount: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    })

    // Определяем, состоит ли пользователь в каждом сообществе
    const communitiesWithMembership = communities.map((community: any) => ({
      ...community,
      isMember: community.members.some((member: any) => member.profileId === profile.id),
      isCreator: community.creatorId === profile.id
    }))

    // Статистика
    const stats = {
      total: await prisma.community.count({ where: { isActive: true } }),
      joined: await prisma.community.count({
        where: {
          isActive: true,
          members: { some: { profileId: profile.id } }
        }
      }),
      created: await prisma.community.count({
        where: {
          isActive: true,
          creatorId: profile.id
        }
      })
    }

    return NextResponse.json({
      communities: communitiesWithMembership,
      stats,
      hasMore: communities.length === limit
    })

  } catch (error) {
    console.error('Ошибка при получении сообществ:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Создать новое сообщество
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = createCommunitySchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { name, description, type, tags, privacy } = validation.data

    // Находим профиль создателя
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' },
        { status: 404 }
      )
    }

    // Проверяем, не существует ли уже сообщество с таким названием
    const existingCommunity = await prisma.community.findFirst({
      where: { 
        name: { equals: name, mode: 'insensitive' },
        isActive: true
      }
    })

    if (existingCommunity) {
      return NextResponse.json(
        { error: 'Сообщество с таким названием уже существует' },
        { status: 409 }
      )
    }

    // Создаем сообщество и автоматически добавляем создателя как участника
    const community = await prisma.$transaction(async (tx: any) => {
      const newCommunity = await tx.community.create({
        data: {
          name,
          description,
          type,
          tags: tags.map(tag => tag.toLowerCase()),
          privacy,
          creatorId: profile.id,
          memberCount: 1
        }
      })

      // Автоматически добавляем создателя как ADMIN
      await tx.communityMember.create({
        data: {
          communityId: newCommunity.id,
          profileId: profile.id,
          role: 'ADMIN'
        }
      })

      return newCommunity
    })

    // Начисляем T-Coins за создание сообщества
    await GamificationService.awardXP(session.user.id, 'PROFILE_UPDATED', 2) // Удвоенная награда

    return NextResponse.json({
      success: true,
      community,
      message: 'Сообщество успешно создано!'
    })

  } catch (error) {
    console.error('Ошибка при создании сообщества:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
