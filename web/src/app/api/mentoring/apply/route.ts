import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    const { programId } = await request.json()

    if (!programId) {
      return NextResponse.json(
        { error: 'ID программы обязателен' }, 
        { status: 400 }
      )
    }

    // Проверяем существование программы
    const program = await prisma.mentorProgram.findUnique({
      where: { id: programId },
      include: {
        participants: true
      }
    })

    if (!program) {
      return NextResponse.json(
        { error: 'Менторская программа не найдена' }, 
        { status: 404 }
      )
    }

    if (program.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Программа недоступна' }, 
        { status: 400 }
      )
    }

    // Проверяем профиль пользователя
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' }, 
        { status: 404 }
      )
    }

    // Проверяем, не участвует ли уже в программе
    const existingParticipation = await prisma.userMentorProgram.findUnique({
      where: {
        profileId_programId: {
          profileId: profile.id,
          programId: programId
        }
      }
    })

    if (existingParticipation) {
      return NextResponse.json(
        { error: 'Вы уже участвуете в этой программе' }, 
        { status: 409 }
      )
    }

    // Проверяем свободные места
    const menteeCount = program.participants.filter((p: any) => p.role === 'MENTEE').length
    if (menteeCount >= program.maxSlots) {
      return NextResponse.json(
        { error: 'В программе нет свободных мест' }, 
        { status: 409 }
      )
    }

    // Добавляем пользователя в программу как MENTEE
    const participation = await prisma.userMentorProgram.create({
      data: {
        profileId: profile.id,
        programId: programId,
        role: 'MENTEE',
        status: 'ACTIVE'
      },
      include: {
        program: true
      }
    })

    console.log(`👨‍🏫 Пользователь ${session.user.email} присоединился к менторской программе "${program.title}"`)

    return NextResponse.json({ 
      success: true,
      message: `Вы успешно присоединились к программе "${program.title}"`,
      participation
    })

  } catch (error) {
    console.error('Ошибка при подаче заявки в менторскую программу:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' }, 
      { status: 500 }
    )
  }
}
