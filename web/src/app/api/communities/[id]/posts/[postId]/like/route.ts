import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GamificationService } from '@/lib/gamification'

// Поставить/убрать лайк
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

    // Проверяем, что пост существует и принадлежит сообществу
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

    // Проверяем доступ к сообществу
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

    // Проверяем, есть ли уже лайк
    const existingLike = await prisma.communityPostLike.findUnique({
      where: {
        postId_profileId: {
          postId: postId,
          profileId: profile.id
        }
      }
    })

    let action: 'liked' | 'unliked'
    let newLikesCount: number

    if (existingLike) {
      // Убираем лайк
      await prisma.$transaction(async (tx: any) => {
        await tx.communityPostLike.delete({
          where: {
            postId_profileId: {
              postId: postId,
              profileId: profile.id
            }
          }
        })

        await tx.communityPost.update({
          where: { id: postId },
          data: {
            likesCount: { decrement: 1 }
          }
        })
      })

      action = 'unliked'
      newLikesCount = post.likesCount - 1

    } else {
      // Ставим лайк
      await prisma.$transaction(async (tx: any) => {
        await tx.communityPostLike.create({
          data: {
            postId: postId,
            profileId: profile.id
          }
        })

        await tx.communityPost.update({
          where: { id: postId },
          data: {
            likesCount: { increment: 1 }
          }
        })
      })

      action = 'liked'
      newLikesCount = post.likesCount + 1

      // Начисляем T-Coins за социальную активность
      if (post.authorId !== profile.id) { // Не за лайк своего поста
        await GamificationService.awardXP(session.user.id, 'CHAT_WITH_AI') // Небольшая награда
      }
    }

    return NextResponse.json({
      success: true,
      action,
      likesCount: newLikesCount,
      isLiked: action === 'liked'
    })

  } catch (error) {
    console.error('Ошибка при обработке лайка:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
