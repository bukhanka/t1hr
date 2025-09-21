import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GamificationService } from '@/lib/gamification'
import { z } from 'zod'

const createPostSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'Содержимое поста обязательно'),
  type: z.enum(['TEXT', 'QUESTION', 'RESOURCE_SHARE', 'EVENT']).default('TEXT')
})

// Получить посты сообщества
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Проверяем доступ к сообществу
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' },
        { status: 404 }
      )
    }

    // Проверяем, что сообщество существует и пользователь имеет к нему доступ
    const community = await prisma.community.findFirst({
      where: {
        id,
        isActive: true,
        OR: [
          { privacy: 'PUBLIC' },
          { members: { some: { profileId: profile.id } } }
        ]
      }
    })

    if (!community) {
      return NextResponse.json(
        { error: 'Сообщество не найдено или доступ запрещен' },
        { status: 404 }
      )
    }

    // Получаем посты
    const posts = await prisma.communityPost.findMany({
      where: { communityId: id },
      include: {
        author: {
          include: {
            user: {
              select: { name: true, image: true }
            }
          }
        },
        likes: {
          select: {
            profileId: true
          }
        },
        comments: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              include: {
                user: {
                  select: { name: true, image: true }
                }
              }
            }
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    })

    // Добавляем информацию о том, лайкнул ли текущий пользователь
    const postsWithUserActions = posts.map((post: any) => ({
      ...post,
      isLikedByUser: post.likes.some((like: any) => like.profileId === profile.id),
      likes: undefined, // Убираем детали лайков из ответа
      recentComments: post.comments,
      comments: undefined // Убираем полный список комментариев
    }))

    return NextResponse.json({
      posts: postsWithUserActions,
      hasMore: posts.length === limit
    })

  } catch (error) {
    console.error('Ошибка при получении постов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Создать новый пост
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validation = createPostSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { title, content, type } = validation.data

    // Находим профиль пользователя
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' },
        { status: 404 }
      )
    }

    // Проверяем членство в сообществе
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_profileId: {
          communityId: id,
          profileId: profile.id
        }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Вы должны быть участником сообщества для создания постов' },
        { status: 403 }
      )
    }

    // Создаем пост и обновляем счетчики
    const post = await prisma.$transaction(async (tx: any) => {
      const newPost = await tx.communityPost.create({
        data: {
          communityId: id,
          authorId: profile.id,
          title,
          content,
          type
        },
        include: {
          author: {
            include: {
              user: {
                select: { name: true, image: true }
              }
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        }
      })

      return newPost
    })

    // Начисляем T-Coins за создание поста
    await GamificationService.awardXP(session.user.id, 'PROFILE_UPDATED', 1.5) // Бонус за активность в сообществе

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        isLikedByUser: false,
        recentComments: []
      },
      message: 'Пост успешно создан!'
    })

  } catch (error) {
    console.error('Ошибка при создании поста:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
