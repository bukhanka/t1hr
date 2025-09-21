import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GamificationService } from '@/lib/gamification'
import { z } from 'zod'

const createCommentSchema = z.object({
  content: z.string().min(1, 'Комментарий не может быть пустым').max(500, 'Максимум 500 символов')
})

// Получить комментарии к посту
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const { id, postId } = await params
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
        { error: 'Доступ к сообществу запрещен' },
        { status: 403 }
      )
    }

    // Получаем комментарии
    const comments = await prisma.communityPostComment.findMany({
      where: { postId },
      include: {
        author: {
          include: {
            user: {
              select: { name: true, image: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    return NextResponse.json({
      comments,
      hasMore: comments.length === limit
    })

  } catch (error) {
    console.error('Ошибка при получении комментариев:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Создать новый комментарий
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const { id, postId } = await params
    const body = await request.json()
    const validation = createCommentSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { content } = validation.data

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
        { error: 'Вы должны быть участником сообщества для комментирования' },
        { status: 403 }
      )
    }

    // Проверяем, что пост существует
    const post = await prisma.communityPost.findFirst({
      where: {
        id: postId,
        communityId: id
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Пост не найден' },
        { status: 404 }
      )
    }

    // Создаем комментарий и обновляем счетчики
    const comment = await prisma.$transaction(async (tx: any) => {
      const newComment = await tx.communityPostComment.create({
        data: {
          postId,
          authorId: profile.id,
          content
        },
        include: {
          author: {
            include: {
              user: {
                select: { name: true, image: true }
              }
            }
          }
        }
      })

      // Увеличиваем счетчик комментариев
      await tx.communityPost.update({
        where: { id: postId },
        data: {
          commentsCount: { increment: 1 }
        }
      })

      return newComment
    })

    // Начисляем T-Coins за комментарий
    await GamificationService.awardXP(session.user.id, 'CHAT_WITH_AI') // Небольшая награда за активность

    return NextResponse.json({
      success: true,
      comment,
      message: 'Комментарий добавлен!'
    })

  } catch (error) {
    console.error('Ошибка при создании комментария:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
