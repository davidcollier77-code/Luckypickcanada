import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'

const COOKIE_NAME = 'lp_admin'

function expectedToken(): string {
  const password = process.env.ADMIN_PASSWORD
  if (!password) throw new Error('ADMIN_PASSWORD is not set')
  // Derive a stable, non-reversible cookie value from the password.
  return createHmac('sha256', password).update('luckypick-admin').digest('hex')
}

// Constant-time comparison to avoid leaking timing information.
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export function verifyPassword(candidate: string): boolean {
  const password = process.env.ADMIN_PASSWORD
  if (!password) return false
  return safeEqual(candidate, password)
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return false
  try {
    return safeEqual(token, expectedToken())
  } catch {
    return false
  }
}

export async function setAdminCookie(): Promise<void> {
  const store = await cookies()
  store.set(COOKIE_NAME, expectedToken(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  })
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}
