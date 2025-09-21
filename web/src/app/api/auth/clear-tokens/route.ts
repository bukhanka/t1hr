import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Создаем ответ с очисткой всех NextAuth cookies
    const response = NextResponse.json({ 
      success: true, 
      message: 'Токены очищены' 
    })
    
    // Очищаем все возможные NextAuth cookies
    const cookiesToClear = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Secure-next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
    ]
    
    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    })
    
    return response
  } catch (error) {
    console.error('Error clearing tokens:', error)
    return NextResponse.json(
      { success: false, message: 'Ошибка при очистке токенов' },
      { status: 500 }
    )
  }
}
