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

    // Только HR может получать анализ skill gaps
    if (session.user.role !== 'HR') {
      return NextResponse.json(
        { error: 'Недостаточно прав для доступа к анализу навыков' },
        { status: 403 }
      )
    }

    console.log('🔍 Анализируем разрывы в компетенциях...')

    // Анализ разрывов по уровням и ролям
    const [
      skillGapsByLevel,
      careerProgressionNeeds,
      skillsByJobTitle,
      learningGoals,
      departmentSkillGaps
    ] = await Promise.all([
      // Анализ недостающих навыков для перехода на следующий уровень
      prisma.$queryRaw`
        WITH current_skills AS (
          SELECT 
            p."jobTitle",
            s.name as skill_name,
            s.category,
            COUNT(*) as current_count,
            AVG(us.level) as avg_level,
            p.department
          FROM "Profile" p
          LEFT JOIN "User" u ON p."userId" = u.id
          LEFT JOIN "UserSkill" us ON p.id = us."profileId"
          LEFT JOIN "Skill" s ON us."skillId" = s.id
          WHERE u.role = 'EMPLOYEE' AND p."jobTitle" IS NOT NULL
          GROUP BY p."jobTitle", s.name, s.category, p.department
        ),
        target_skills AS (
          SELECT 
            'Senior' as target_level,
            skill_name,
            category,
            COUNT(*) as required_count,
            AVG(avg_level) as required_avg_level
          FROM current_skills
          WHERE "jobTitle" LIKE '%Senior%'
          GROUP BY skill_name, category
          HAVING COUNT(*) >= 3
        )
        SELECT 
          cs."jobTitle" as current_role,
          ts.target_level,
          ts.skill_name,
          ts.category,
          ts.required_count,
          COALESCE(cs.current_count, 0) as current_count,
          (ts.required_count - COALESCE(cs.current_count, 0)) as gap_size,
          ts.required_avg_level,
          COALESCE(cs.avg_level, 0) as current_avg_level
        FROM target_skills ts
        LEFT JOIN current_skills cs ON ts.skill_name = cs.skill_name 
          AND cs."jobTitle" NOT LIKE '%Senior%'
        WHERE (ts.required_count - COALESCE(cs.current_count, 0)) > 0
        ORDER BY gap_size DESC, current_role
        LIMIT 50
      `,
      
      // Анализ карьерных амбиций vs текущих навыков
      prisma.$queryRaw`
        SELECT 
          cg.target as desired_role,
          cg."goalType",
          COUNT(DISTINCT p.id) as employees_interested,
          STRING_AGG(DISTINCT s.name, ', ') as current_skills,
          AVG(p."profileStrength") as avg_profile_strength
        FROM "CareerGoal" cg
        LEFT JOIN "Profile" p ON cg."profileId" = p.id
        LEFT JOIN "User" u ON p."userId" = u.id
        LEFT JOIN "UserSkill" us ON p.id = us."profileId"
        LEFT JOIN "Skill" s ON us."skillId" = s.id AND us.level >= 3
        WHERE u.role = 'EMPLOYEE'
        GROUP BY cg.target, cg."goalType"
        HAVING COUNT(DISTINCT p.id) >= 2
        ORDER BY employees_interested DESC
        LIMIT 20
      `,
      
      // Распределение навыков по ролям
      prisma.$queryRaw`
        SELECT 
          p."jobTitle",
          s.name as skill_name,
          s.category,
          COUNT(*) as skill_holders,
          AVG(us.level) as avg_skill_level,
          COUNT(CASE WHEN us."isVerified" = true THEN 1 END) as verified_holders,
          COUNT(CASE WHEN us.status = 'WANTS_TO_LEARN' THEN 1 END) as want_to_learn
        FROM "Profile" p
        LEFT JOIN "User" u ON p."userId" = u.id
        LEFT JOIN "UserSkill" us ON p.id = us."profileId"
        LEFT JOIN "Skill" s ON us."skillId" = s.id
        WHERE u.role = 'EMPLOYEE' AND p."jobTitle" IS NOT NULL
        GROUP BY p."jobTitle", s.name, s.category
        HAVING COUNT(*) >= 2
        ORDER BY p."jobTitle", skill_holders DESC
      `,
      
      // Цели обучения vs доступные курсы
      prisma.$queryRaw`
        SELECT 
          s.name as skill_name,
          COUNT(CASE WHEN us.status = 'WANTS_TO_LEARN' THEN 1 END) as want_to_learn_count,
          COUNT(CASE WHEN c.skills @> ARRAY[s.name] THEN 1 END) as available_courses,
          STRING_AGG(DISTINCT c.title, '; ') as course_titles
        FROM "Skill" s
        LEFT JOIN "UserSkill" us ON s.id = us."skillId"
        LEFT JOIN "Course" c ON s.name = ANY(c.skills)
        GROUP BY s.id, s.name
        HAVING COUNT(CASE WHEN us.status = 'WANTS_TO_LEARN' THEN 1 END) > 0
        ORDER BY want_to_learn_count DESC
        LIMIT 30
      `,
      
      // Разрывы по отделам
      prisma.$queryRaw`
        SELECT 
          p.department,
          s.category as skill_category,
          COUNT(DISTINCT us."skillId") as unique_skills,
          COUNT(DISTINCT p.id) as employees,
          AVG(us.level) as avg_skill_level,
          COUNT(CASE WHEN us."isVerified" = true THEN 1 END) as verified_skills,
          COUNT(CASE WHEN us.level >= 4 THEN 1 END) as advanced_skills
        FROM "Profile" p
        LEFT JOIN "User" u ON p."userId" = u.id
        LEFT JOIN "UserSkill" us ON p.id = us."profileId"
        LEFT JOIN "Skill" s ON us."skillId" = s.id
        WHERE u.role = 'EMPLOYEE' AND p.department IS NOT NULL
        GROUP BY p.department, s.category
        HAVING COUNT(DISTINCT p.id) >= 3
        ORDER BY p.department, avg_skill_level DESC
      `
    ])

    // Обрабатываем результаты
    const analysis = {
      levelProgressionGaps: (skillGapsByLevel as any[]).reduce((acc: any, gap: any) => {
        const key = `${gap.current_role} → ${gap.target_level}`
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push({
          skill: gap.skill_name,
          category: gap.category,
          gapSize: Number(gap.gap_size),
          requiredCount: Number(gap.required_count),
          currentCount: Number(gap.current_count),
          requiredLevel: Math.round((Number(gap.required_avg_level) || 0) * 100) / 100,
          currentLevel: Math.round((Number(gap.current_avg_level) || 0) * 100) / 100
        })
        return acc
      }, {}),
      
      careerAmbitionsVsSkills: (careerProgressionNeeds as any[]).map((career: any) => ({
        desiredRole: career.desired_role,
        goalType: career.goalType,
        interestedEmployees: Number(career.employees_interested),
        currentSkillsPreview: (career.current_skills || '').split(', ').slice(0, 5),
        averageProfileStrength: Math.round((Number(career.avg_profile_strength) || 0) * 100) / 100,
        skillsGapAnalysis: 'Требуется детальный анализ' // Можно расширить
      })),
      
      roleBasedSkillDistribution: (skillsByJobTitle as any[]).reduce((acc: any, skill: any) => {
        const role = skill.jobTitle
        if (!acc[role]) {
          acc[role] = {
            totalSkillHolders: 0,
            topSkills: []
          }
        }
        acc[role].topSkills.push({
          skill: skill.skill_name,
          category: skill.category,
          holders: Number(skill.skill_holders),
          averageLevel: Math.round((Number(skill.avg_skill_level) || 0) * 100) / 100,
          verifiedHolders: Number(skill.verified_holders),
          wantToLearn: Number(skill.want_to_learn)
        })
        acc[role].totalSkillHolders = Math.max(acc[role].totalSkillHolders, Number(skill.skill_holders))
        return acc
      }, {}),
      
      learningDemandVsSupply: (learningGoals as any[]).map((goal: any) => ({
        skill: goal.skill_name,
        demandCount: Number(goal.want_to_learn_count),
        availableCourses: Number(goal.available_courses) || 0,
        courseOptions: (goal.course_titles || '').split('; ').filter(Boolean),
        supplyGap: Number(goal.want_to_learn_count) > 0 && Number(goal.available_courses) === 0 ? 'HIGH' :
                   Number(goal.want_to_learn_count) > Number(goal.available_courses) * 3 ? 'MEDIUM' : 'LOW'
      })),
      
      departmentSkillAnalysis: (departmentSkillGaps as any[]).reduce((acc: any, dept: any) => {
        const deptName = dept.department
        if (!acc[deptName]) {
          acc[deptName] = {
            totalEmployees: Number(dept.employees),
            skillCategories: []
          }
        }
        acc[deptName].skillCategories.push({
          category: dept.skill_category,
          uniqueSkills: Number(dept.unique_skills),
          averageLevel: Math.round((Number(dept.avg_skill_level) || 0) * 100) / 100,
          verifiedSkills: Number(dept.verified_skills),
          advancedSkills: Number(dept.advanced_skills),
          skillDensity: Math.round((Number(dept.unique_skills) / Number(dept.employees)) * 100) / 100
        })
        return acc
      }, {}),
      
      recommendations: [
        {
          type: 'CRITICAL_SKILL_GAP',
          message: 'Создать программу "Middle → Senior Developer"',
          priority: 'HIGH',
          action: 'launch_training_program'
        },
        {
          type: 'LEARNING_DEMAND',
          message: 'Высокий спрос на курсы по Machine Learning',
          priority: 'MEDIUM', 
          action: 'create_ml_courses'
        },
        {
          type: 'DEPARTMENT_BALANCE',
          message: 'Неравномерное распределение навыков по отделам',
          priority: 'LOW',
          action: 'skill_balancing_initiative'
        }
      ],
      
      generatedAt: new Date(),
      analysisScope: 'company-wide'
    }

    return NextResponse.json(analysis)

  } catch (error) {
    console.error('Ошибка при анализе skill gaps:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
