import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key'

export interface AdminUser {
  username: string
  role: string
  ip: string
  iat?: number
}

/**
 * 验证JWT token
 */
export function verifyToken(token: string): AdminUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminUser
    return decoded
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * 从请求中获取并验证管理员token
 */
export function getAdminFromRequest(request: NextRequest): AdminUser | null {
  try {
    // 从cookie中获取token
    const token = request.cookies.get('admin-token')?.value
    
    if (!token) {
      return null
    }
    
    // 验证token（JWT库会自动检查过期时间）
    const admin = verifyToken(token)
    
    if (!admin) {
      return null
    }
    
    return admin
    
  } catch (error) {
    console.error('Get admin from request failed:', error)
    return null
  }
}

/**
 * 检查是否为管理员请求
 */
export function isAdminRequest(request: NextRequest): boolean {
  const admin = getAdminFromRequest(request)
  return admin !== null && admin.role === 'admin'
}

/**
 * 生成新的JWT token
 */
export function generateToken(username: string, ip: string): string {
  return jwt.sign(
    {
      username,
      role: 'admin',
      ip
    },
    JWT_SECRET,
    { expiresIn: '30m' }
  )
}

/**
 * 验证管理员权限（用于API路由）
 */
export async function verifyAdmin(request: NextRequest): Promise<{ success: boolean; admin?: AdminUser; error?: string }> {
  try {
    const admin = getAdminFromRequest(request)
    
    if (!admin) {
      return { success: false, error: 'No valid admin token' }
    }
    
    if (admin.role !== 'admin') {
      return { success: false, error: 'Insufficient permissions' }
    }
    
    return { success: true, admin }
  } catch (error) {
    console.error('Admin verification failed:', error)
    return { success: false, error: 'Verification failed' }
  }
}

/**
 * 记录管理员操作日志
 */
export function logAdminAction(action: string, admin: AdminUser, details?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    admin: admin.username,
    ip: admin.ip,
    details
  }
  
  // 在生产环境中，这里应该写入到日志文件或数据库
  console.log('[ADMIN ACTION]', JSON.stringify(logEntry))
} 