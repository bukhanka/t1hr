import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== Role.HR) {
      return NextResponse.json(
        { error: "Доступ запрещен. Требуются права HR." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { profileId, rotationStatus } = body

    if (!profileId || !rotationStatus) {
      return NextResponse.json(
        { error: "Отсутствуют обязательные параметры" },
        { status: 400 }
      )
    }

    if (!['ROTATION', 'STABLE'].includes(rotationStatus)) {
      return NextResponse.json(
        { error: "Недопустимый статус ротации" },
        { status: 400 }
      )
    }

    // Проверяем, существует ли профиль
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { user: true }
    })

    if (!profile) {
      return NextResponse.json(
        { error: "Профиль не найден" },
        { status: 404 }
      )
    }

    // Обновляем статус ротации
    const updatedProfile = await prisma.profile.update({
      where: { id: profileId },
      data: { 
        rotationStatus: rotationStatus as 'ROTATION' | 'STABLE',
        updatedAt: new Date()
      },
      include: { user: true }
    })

    // Логируем действие для аудита
    console.log(`HR ${session.user.email} изменил статус ротации для ${profile.user.email} на ${rotationStatus}`)

    return NextResponse.json({
      success: true,
      profile: {
        id: updatedProfile.id,
        rotationStatus: updatedProfile.rotationStatus,
        employeeName: updatedProfile.user.name,
        employeeEmail: updatedProfile.user.email
      }
    })

  } catch (error) {
    console.error("Ошибка при обновлении статуса ротации:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== Role.HR) {
      return NextResponse.json(
        { error: "Доступ запрещен. Требуются права HR." },
        { status: 403 }
      )
    }

    // Получаем статистику по ротациям
    const [total, inRotation, stable] = await Promise.all([
      prisma.profile.count({
        where: {
          user: {
            role: Role.EMPLOYEE
          }
        }
      }),
      prisma.profile.count({
        where: {
          rotationStatus: 'ROTATION',
          user: {
            role: Role.EMPLOYEE
          }
        }
      }),
      prisma.profile.count({
        where: {
          rotationStatus: 'STABLE',
          user: {
            role: Role.EMPLOYEE
          }
        }
      })
    ])

    return NextResponse.json({
      total,
      inRotation,
      stable,
      rotationPercentage: Math.round((inRotation / total) * 100)
    })

  } catch (error) {
    console.error("Ошибка при получении статистики ротации:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}
