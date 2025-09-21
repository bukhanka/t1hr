import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GamificationService } from '@/lib/gamification'

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

    // Проверяем существование сообщества
    const community = await prisma.community.findUnique({
      where: { id, isActive: true }
    })

    if (!community) {
      return NextResponse.json(
        { error: 'Сообщество не найдено' },
        { status: 404 }
      )
    }

    // Проверяем, не состоит ли уже пользователь в сообществе
    const existingMembership = await prisma.communityMember.findUnique({
      where: {
        communityId_profileId: {
          communityId: id,
          profileId: profile.id
        }
      }
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Вы уже состоите в этом сообществе' },
        { status: 409 }
      )
    }

    // Проверяем политику конфиденциальности
    if (community.privacy === 'PRIVATE' || community.privacy === 'INVITE_ONLY') {
      return NextResponse.json(
        { error: 'Сообщество закрытое. Нужно приглашение' },
        { status: 403 }
      )
    }

    // Присоединяемся к сообществу
    await prisma.$transaction(async (tx: any) => {
      await tx.communityMember.create({
        data: {
          communityId: id,
          profileId: profile.id,
          role: 'MEMBER'
        }
      })

      // Увеличиваем счетчик участников
      await tx.community.update({
        where: { id },
        data: {
          memberCount: { increment: 1 }
        }
      })
    })

    // Начисляем T-Coins за networking активность
    await GamificationService.awardXP(session.user.id, 'PROFILE_UPDATED')

    return NextResponse.json({
      success: true,
      message: `Добро пожаловать в сообщество "${community.name}"!`
    })

  } catch (error) {
    console.error('Ошибка при присоединении к сообществу:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
        { error: 'Вы не состоите в этом сообществе' },
        { status: 404 }
      )
    }

    // Проверяем, является ли пользователь создателем
    const community = await prisma.community.findUnique({
      where: { id }
    })

    if (community?.creatorId === profile.id) {
      return NextResponse.json(
        { error: 'Создатель не может покинуть сообщество. Сначала передайте права администратора' },
        { status: 403 }
      )
    }

    // Покидаем сообщество
    await prisma.$transaction(async (tx: any) => {
      await tx.communityMember.delete({
        where: {
          communityId_profileId: {
            communityId: id,
            profileId: profile.id
          }
        }
      })

      // Уменьшаем счетчик участников
      await tx.community.update({
        where: { id },
        data: {
          memberCount: { decrement: 1 }
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Вы успешно покинули сообщество'
    })

  } catch (error) {
    console.error('Ошибка при выходе из сообщества:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
