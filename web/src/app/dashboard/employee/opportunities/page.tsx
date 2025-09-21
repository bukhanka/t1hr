import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OpportunityCard } from "@/components/opportunity-card"
import Link from "next/link"
import { 
  BookOpen,
  Users,
  Briefcase,
  Award,
  TrendingUp,
  ArrowLeft
} from "lucide-react"

export default async function OpportunitiesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== Role.EMPLOYEE) {
    redirect("/dashboard")
  }

  // Получаем профиль пользователя со всеми связанными данными
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: {
      userSkills: {
        include: { skill: true }
      },
      userProjects: {
        include: { project: true }
      },
      careerGoals: true,
      userCourses: {
        include: { course: true }
      },
      mentorPrograms: {
        include: { program: true }
      }
    }
  })

  if (!profile) {
    redirect("/dashboard/employee")
  }

  // Получаем рекомендации
  
  // 1. Курсы - которые соответствуют навыкам которые хочет изучить или карьерным целям
  const wantToLearnSkills = profile.userSkills
    .filter(us => us.status === 'WANTS_TO_LEARN')
    .map(us => us.skill.name.toLowerCase())
  
  const currentSkills = profile.userSkills
    .filter(us => us.status === 'USING')
    .map(us => us.skill.name.toLowerCase())

  const enrolledCourseIds = profile.userCourses.map(uc => uc.courseId)

  const recommendedCourses = await prisma.course.findMany({
    where: {
      status: 'ACTIVE',
      NOT: {
        id: { in: enrolledCourseIds }
      }
    },
    take: 6
  })

  // 2. Менторские программы - которые помогают развивать нужные навыки
  const participatingProgramIds = profile.mentorPrograms.map(ump => ump.programId)
  
  const recommendedMentorPrograms = await prisma.mentorProgram.findMany({
    where: {
      status: 'ACTIVE',
      NOT: {
        id: { in: participatingProgramIds }
      }
    },
    take: 4
  })

  // 3. Проекты - в которых пользователь еще не участвовал
  const currentProjectIds = profile.userProjects.map(up => up.projectId)
  
  const recommendedProjects = await prisma.project.findMany({
    where: {
      status: 'ACTIVE',
      NOT: {
        id: { in: currentProjectIds }
      }
    },
    take: 6
  })

  // 4. Вакансии - соответствующие уровню и навыкам
  const jobOpenings = await prisma.jobOpening.findMany({
    where: {
      status: 'OPEN'
    },
    take: 4
  })

  // 5. Популярные навыки, которых у пользователя нет
  const allSkills = await prisma.skill.findMany({
    where: {
      NOT: {
        userSkills: {
          some: {
            profileId: profile.id
          }
        }
      }
    },
    take: 8
  })

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/employee">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Лента Возможностей
            </h1>
            <p className="text-muted-foreground">
              Персонализированные рекомендации для вашего карьерного развития
            </p>
          </div>
        </div>
      </div>

      {/* Фильтры/Табы по типам */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="courses">Курсы</TabsTrigger>
          <TabsTrigger value="mentoring">Менторство</TabsTrigger>
          <TabsTrigger value="projects">Проекты</TabsTrigger>
          <TabsTrigger value="jobs">Вакансии</TabsTrigger>
          <TabsTrigger value="skills">Навыки</TabsTrigger>
        </TabsList>

        {/* Все возможности */}
        <TabsContent value="all" className="space-y-6">
          {/* Курсы */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
              Рекомендованные курсы
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommendedCourses.slice(0, 3).map((course) => (
                <OpportunityCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  type="course"
                  level={course.level}
                  xpReward={course.xpReward}
                  tags={course.skills}
                  duration={course.duration || undefined}
                  format={course.format}
                  skills={course.skills}
                  actionText="Записаться"
                />
              ))}
            </div>
          </div>

          {/* Проекты */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-green-600" />
              Интересные проекты
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommendedProjects.slice(0, 3).map((project) => (
                <OpportunityCard
                  key={project.id}
                  id={project.id}
                  title={project.name}
                  description={project.description || "Интересный проект для применения ваших навыков"}
                  type="project"
                  actionText="Интересует"
                />
              ))}
            </div>
          </div>

          {/* Менторские программы */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-purple-600" />
              Менторские программы
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {recommendedMentorPrograms.slice(0, 2).map((program) => (
                <OpportunityCard
                  key={program.id}
                  id={program.id}
                  title={program.title}
                  description={program.description}
                  type="mentor"
                  tags={program.skills}
                  skills={program.skills}
                  maxSlots={program.maxSlots}
                  mentorId={program.mentorId}
                  actionText="Подать заявку"
                />
              ))}
            </div>
          </div>

          {/* Вакансии */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
              Карьерные возможности
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {jobOpenings.slice(0, 2).map((job) => (
                <OpportunityCard
                  key={job.id}
                  id={job.id}
                  title={job.title}
                  description={job.description}
                  type="job"
                  level={job.level}
                  tags={job.requirements}
                  requirements={job.requirements}
                  department={job.department}
                  actionText="Подать заявку"
                />
              ))}
            </div>
          </div>

          {/* Новые навыки */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2 text-pink-600" />
              Навыки для изучения
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {allSkills.slice(0, 4).map((skill) => (
                <OpportunityCard
                  key={skill.id}
                  id={skill.id}
                  title={skill.name}
                  description={skill.description || "Популярный навык в компании"}
                  type="skill"
                  tags={skill.category ? [skill.category] : []}
                  category={skill.category || undefined}
                  actionText="Добавить в цели"
                />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Отдельные табы для каждого типа */}
        <TabsContent value="courses" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendedCourses.map((course) => (
              <OpportunityCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description}
                type="course"
                level={course.level}
                xpReward={course.xpReward}
                tags={course.skills}
                duration={course.duration || undefined}
                format={course.format}
                skills={course.skills}
                actionText="Записаться"
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mentoring" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {recommendedMentorPrograms.map((program) => (
              <OpportunityCard
                key={program.id}
                id={program.id}
                title={program.title}
                description={program.description}
                type="mentor"
                tags={program.skills}
                skills={program.skills}
                maxSlots={program.maxSlots}
                mentorId={program.mentorId}
                actionText="Подать заявку"
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendedProjects.map((project) => (
              <OpportunityCard
                key={project.id}
                id={project.id}
                title={project.name}
                description={project.description || "Интересный проект для применения ваших навыков"}
                type="project"
                actionText="Интересует"
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {jobOpenings.map((job) => (
              <OpportunityCard
                key={job.id}
                id={job.id}
                title={job.title}
                description={job.description}
                type="job"
                level={job.level}
                tags={job.requirements}
                requirements={job.requirements}
                department={job.department}
                actionText="Подать заявку"
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {allSkills.map((skill) => (
              <OpportunityCard
                key={skill.id}
                id={skill.id}
                title={skill.name}
                description={skill.description || "Популярный навык в компании"}
                type="skill"
                tags={skill.category ? [skill.category] : []}
                category={skill.category || undefined}
                actionText="Добавить в цели"
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
