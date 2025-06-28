import { NextRequest, NextResponse } from 'next/server'
import { jsonStorage } from '@/lib/json-storage'
import { AdminLoginRequest, AdminLoginResponse, AdminData } from '@/lib/data/types'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key'
const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 30 * 60 * 1000 // 30分钟

export async function POST(request: NextRequest) {
  try {
    const body: AdminLoginRequest = await request.json()
    const { username, password } = body
    
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '用户名和密码不能为空' },
        { status: 400 }
      )
    }

    // 获取管理员信息
    const adminData: AdminData = await jsonStorage.read('admin.json')
    const admin = adminData.admin

    if (!admin || admin.username !== username) {
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      )
    }

    // 检查账户是否被锁定
    if (admin.lockedUntil && new Date(admin.lockedUntil) > new Date()) {
      return NextResponse.json(
        { success: false, message: '账户已被锁定，请稍后再试' },
        { status: 423 }
      )
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash)

    if (!isPasswordValid) {
      // 增加登录失败次数
      const newLoginAttempts = admin.loginAttempts + 1
      const updateData: Partial<typeof admin> = {
        loginAttempts: newLoginAttempts,
        updatedAt: new Date().toISOString()
      }

      // 如果失败次数超过5次，锁定账户30分钟
      if (newLoginAttempts >= MAX_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + LOCKOUT_TIME).toISOString()
      }

      // 更新管理员信息
      await jsonStorage.write('admin.json', {
        admin: { ...admin, ...updateData }
      })

      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      )
    }

    // 登录成功，重置失败次数
    await jsonStorage.write('admin.json', {
      admin: {
        ...admin,
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    })

    // 生成JWT token
    const token = jwt.sign(
      { username: admin.username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    const response: AdminLoginResponse = {
      success: true,
      token,
      message: '登录成功'
    }

    // 创建NextResponse对象并设置cookie
    const nextResponse = NextResponse.json(response)
    
    // 设置httpOnly cookie，有效期24小时
    nextResponse.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24小时
    })

    return nextResponse
  } catch (error) {
    console.error('管理员登录失败:', error)
    return NextResponse.json(
      { success: false, message: '登录失败' },
      { status: 500 }
    )
  }
}

// 登出API
export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: '登出成功'
    })
    
    // 清除cookie
    response.cookies.delete('admin-token')
    
    return response
    
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: '登出失败' },
      { status: 500 }
    )
  }
} 