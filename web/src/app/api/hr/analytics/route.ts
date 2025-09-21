import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' }, 
        { status: 401 }
      )
    }

    // Только HR может получать аналитику
    if (session.user.role !== 'HR') {
      return NextResponse.json(
        { error: 'Недостаточно прав для доступа к аналитике' },
        { status: 403 }
      )
    }

    console.log('📊 Генерируем HR аналитику...')

    // Параллельно получаем все необходимые данные
    const [
      totalUsers,
      profileStats,
      skillsDistribution,
      departmentStats,
      engagementStats,
      careerGoalsStats,
      tcoinsStats,
      onboardingStats,
      projectParticipation
    ] = await Promise.all([
      // Общее количество пользователей
      prisma.user.count({
        where: { role: 'EMPLOYEE' }
      }),
      
      // Статистика профилей
      prisma.profile.aggregate({
        where: {
          user: { role: 'EMPLOYEE' }
        },
        _avg: {
          profileStrength: true,
          xp: true,
          level: true,
          tCoins: true
        },
        _count: {
          id: true
        }
      }),
      
      // Распределение навыков
      prisma.$queryRaw`
        SELECT 
          s.name as skill_name,
          s.category,
          COUNT(us.id) as user_count,
          AVG(us.level) as avg_level,
          COUNT(CASE WHEN us."isVerified" = true THEN 1 END) as verified_count
        FROM "Skill" s
        LEFT JOIN "UserSkill" us ON s.id = us."skillId"
        LEFT JOIN "Profile" p ON us."profileId" = p.id
        LEFT JOIN "User" u ON p."userId" = u.id
        WHERE u.role = 'EMPLOYEE' OR u.role IS NULL
        GROUP BY s.id, s.name, s.category
        ORDER BY user_count DESC, verified_count DESC
        LIMIT 50
      `,
      
      // Статистика по отделам
      prisma.$queryRaw`
        SELECT 
          department,
          COUNT(*) as employee_count,
          AVG("profileStrength") as avg_profile_strength,
          AVG(xp) as avg_xp,
          COUNT(CASE WHEN "onboardingCompleted" = true THEN 1 END) as onboarded_count
        FROM "Profile" p
        LEFT JOIN "User" u ON p."userId" = u.id
        WHERE u.role = 'EMPLOYEE' AND department IS NOT NULL
        GROUP BY department
        ORDER BY employee_count DESC
      `,
      
      // Статистика вовлеченности (активность за последние 30 дней)
      prisma.$queryRaw`
        SELECT 
          p.department,
          COUNT(DISTINCT p.id) as total_employees,
          COUNT(DISTINCT CASE 
            WHEN t."createdAt" >= NOW() - INTERVAL '30 days' THEN p.id 
          END) as active_employees,
          COUNT(DISTINCT CASE 
            WHEN t."createdAt" >= NOW() - INTERVAL '7 days' THEN p.id 
          END) as weekly_active,
          COALESCE(SUM(CASE 
            WHEN t."createdAt" >= NOW() - INTERVAL '30 days' AND t.amount > 0 
            THEN t.amount ELSE 0 
          END), 0) as total_tcoins_earned
        FROM "Profile" p
        LEFT JOIN "User" u ON p."userId" = u.id
        LEFT JOIN "TCoinTransaction" t ON p.id = t."profileId"
        WHERE u.role = 'EMPLOYEE'
        GROUP BY p.department
        ORDER BY total_employees DESC
      `,
      
      // Статистика карьерных целей
      prisma.$queryRaw`
        SELECT 
          "goalType",
          target,
          COUNT(*) as goal_count,
          AVG(priority) as avg_priority
        FROM "CareerGoal" cg
        LEFT JOIN "Profile" p ON cg."profileId" = p.id
        LEFT JOIN "User" u ON p."userId" = u.id
        WHERE u.role = 'EMPLOYEE'
        GROUP BY "goalType", target
        ORDER BY goal_count DESC
        LIMIT 20
      `,
      
      // Статистика T-Coins
      prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT "profileId") as active_users,
          SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_earned,
          SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END) as total_spent,
          COUNT(CASE WHEN amount > 0 THEN 1 END) as earning_transactions,
          COUNT(CASE WHEN amount < 0 THEN 1 END) as spending_transactions,
          AVG(CASE WHEN amount > 0 THEN amount END) as avg_earning,
          MAX(amount) as max_single_earning
        FROM "TCoinTransaction" t
        LEFT JOIN "Profile" p ON t."profileId" = p.id
        LEFT JOIN "User" u ON p."userId" = u.id
        WHERE u.role = 'EMPLOYEE' 
        AND t."createdAt" >= NOW() - INTERVAL '30 days'
      `,
      
      // Статистика онбординга
      prisma.$queryRaw`
        SELECT 
          COUNT(CASE WHEN "onboardingCompleted" = true THEN 1 END) as completed_onboarding,
          COUNT(CASE WHEN "onboardingCompleted" = false THEN 1 END) as pending_onboarding,
          AVG(CASE WHEN "onboardingCompleted" = true THEN "profileStrength" END) as avg_strength_completed,
          AVG(CASE WHEN "onboardingCompleted" = false THEN "profileStrength" END) as avg_strength_pending,
          COUNT(CASE 
            WHEN "onboardingCompletedAt" >= NOW() - INTERVAL '30 days' 
            THEN 1 
          END) as completed_this_month
        FROM "Profile" p
        LEFT JOIN "User" u ON p."userId" = u.id
        WHERE u.role = 'EMPLOYEE'
      `,
      
      // Участие в проектах
      prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT up."profileId") as employees_with_projects,
          COUNT(*) as total_assignments,
          AVG(projects_per_employee.project_count) as avg_projects_per_employee,
          COUNT(CASE WHEN up.achievements IS NOT NULL THEN 1 END) as assignments_with_achievements
        FROM "UserProject" up
        LEFT JOIN "Profile" p ON up."profileId" = p.id
        LEFT JOIN "User" u ON p."userId" = u.id
        LEFT JOIN (
          SELECT "profileId", COUNT(*) as project_count
          FROM "UserProject"
          GROUP BY "profileId"
        ) projects_per_employee ON up."profileId" = projects_per_employee."profileId"
        WHERE u.role = 'EMPLOYEE'
      `
    ])

    // Обрабатываем результаты
    const analytics = {
      overview: {
        totalEmployees: totalUsers,
        averageProfileStrength: Math.round((profileStats._avg.profileStrength || 0) * 100) / 100,
        averageXP: Math.round(profileStats._avg.xp || 0),
        averageLevel: Math.round((profileStats._avg.level || 0) * 100) / 100,
        averageTCoins: Math.round(profileStats._avg.tCoins || 0)
      },
      
      profileHealth: {
        totalProfiles: profileStats._count.id,
        averageStrength: Math.round((profileStats._avg.profileStrength || 0) * 100) / 100,
        // Вычисляем процент здоровых профилей (strength > 70%)
        healthyProfilesPercentage: await prisma.profile.count({
          where: {
            user: { role: 'EMPLOYEE' },
            profileStrength: { gte: 70 }
          }
        }).then(count => Math.round((count / totalUsers) * 100))
      },
      
      skills: {
        topPopular: (skillsDistribution as any[]).slice(0, 10).map((skill: any) => ({
          name: skill.skill_name,
          category: skill.category,
          userCount: Number(skill.user_count || 0),
          averageLevel: Math.round((Number(skill.avg_level) || 0) * 100) / 100,
          verifiedCount: Number(skill.verified_count || 0)
        })),
        rareSkills: (skillsDistribution as any[]).filter((skill: any) => 
          Number(skill.user_count) > 0 && Number(skill.user_count) <= 5
        ).map((skill: any) => ({
          name: skill.skill_name,
          category: skill.category,
          userCount: Number(skill.user_count || 0),
          verifiedCount: Number(skill.verified_count || 0)
        }))
      },
      
      departments: (departmentStats as any[]).map((dept: any) => ({
        name: dept.department,
        employeeCount: Number(dept.employee_count || 0),
        averageProfileStrength: Math.round((Number(dept.avg_profile_strength) || 0) * 100) / 100,
        averageXP: Math.round(Number(dept.avg_xp) || 0),
        onboardedCount: Number(dept.onboarded_count || 0),
        onboardingPercentage: Math.round((Number(dept.onboarded_count) / Number(dept.employee_count)) * 100)
      })),
      
      engagement: (engagementStats as any[]).map((dept: any) => ({
        department: dept.department || 'Не указан',
        totalEmployees: Number(dept.total_employees || 0),
        activeEmployees: Number(dept.active_employees || 0),
        weeklyActive: Number(dept.weekly_active || 0),
        engagementRate: Number(dept.total_employees) > 0 
          ? Math.round((Number(dept.active_employees) / Number(dept.total_employees)) * 100)
          : 0,
        weeklyEngagementRate: Number(dept.total_employees) > 0 
          ? Math.round((Number(dept.weekly_active) / Number(dept.total_employees)) * 100)
          : 0,
        totalTCoinsEarned: Number(dept.total_tcoins_earned || 0)
      })),
      
      careerGoals: {
        popular: (careerGoalsStats as any[]).slice(0, 10).map((goal: any) => ({
          type: goal.goalType,
          target: goal.target,
          count: Number(goal.goal_count || 0),
          averagePriority: Math.round((Number(goal.avg_priority) || 0) * 100) / 100
        })),
        totalGoalsSet: (careerGoalsStats as any[]).reduce((sum: number, goal: any) => 
          sum + Number(goal.goal_count || 0), 0
        )
      },
      
      tcoinsActivity: {
        activeUsers: Number((tcoinsStats as any[])[0]?.active_users || 0),
        totalEarned: Number((tcoinsStats as any[])[0]?.total_earned || 0),
        totalSpent: Number((tcoinsStats as any[])[0]?.total_spent || 0),
        earningTransactions: Number((tcoinsStats as any[])[0]?.earning_transactions || 0),
        spendingTransactions: Number((tcoinsStats as any[])[0]?.spending_transactions || 0),
        averageEarning: Math.round(Number((tcoinsStats as any[])[0]?.avg_earning || 0)),
        maxSingleEarning: Number((tcoinsStats as any[])[0]?.max_single_earning || 0),
        economyHealth: Number((tcoinsStats as any[])[0]?.total_earned || 0) > 0
          ? Math.round((Number((tcoinsStats as any[])[0]?.total_spent || 0) / 
              Number((tcoinsStats as any[])[0]?.total_earned || 1)) * 100)
          : 0
      },
      
      onboarding: {
        completedCount: Number((onboardingStats as any[])[0]?.completed_onboarding || 0),
        pendingCount: Number((onboardingStats as any[])[0]?.pending_onboarding || 0),
        completionRate: totalUsers > 0 
          ? Math.round((Number((onboardingStats as any[])[0]?.completed_onboarding || 0) / totalUsers) * 100)
          : 0,
        averageStrengthCompleted: Math.round((Number((onboardingStats as any[])[0]?.avg_strength_completed) || 0) * 100) / 100,
        averageStrengthPending: Math.round((Number((onboardingStats as any[])[0]?.avg_strength_pending) || 0) * 100) / 100,
        completedThisMonth: Number((onboardingStats as any[])[0]?.completed_this_month || 0)
      },
      
      projectParticipation: {
        employeesWithProjects: Number((projectParticipation as any[])[0]?.employees_with_projects || 0),
        totalAssignments: Number((projectParticipation as any[])[0]?.total_assignments || 0),
        averageProjectsPerEmployee: Math.round((Number((projectParticipation as any[])[0]?.avg_projects_per_employee) || 0) * 100) / 100,
        assignmentsWithAchievements: Number((projectParticipation as any[])[0]?.assignments_with_achievements || 0),
        participationRate: totalUsers > 0 
          ? Math.round((Number((projectParticipation as any[])[0]?.employees_with_projects || 0) / totalUsers) * 100)
          : 0
      },
      
      generatedAt: new Date(),
      dataFreshness: 'real-time'
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Ошибка при генерации HR аналитики:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
