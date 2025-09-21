"use client"

import { OnboardingQuiz } from '@/components/onboarding-quiz'

export function OnboardingWrapper() {
  const handleComplete = (stats: any) => {
    // После завершения онбординга перенаправляем на дашборд
    setTimeout(() => {
      window.location.href = '/dashboard/employee'
    }, 3000)
  }

  return <OnboardingQuiz onComplete={handleComplete} />
}
