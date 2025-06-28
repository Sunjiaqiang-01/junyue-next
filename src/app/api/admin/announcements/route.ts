import { NextRequest, NextResponse } from 'next/server'
import { jsonStorage } from '@/lib/json-storage'
import { Announcement, PaginatedResponse } from '@/lib/data/types'
import { verifyAdmin } from '@/lib/auth'

// 获取公告列表（管理后台）
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')

    // 构建筛选函数
    const filter = (announcement: Announcement) => {
      if (type && announcement.type !== type) return false
      if (isActive !== null && announcement.isActive !== (isActive === 'true')) return false
      return true
    }

    // 获取分页数据
    const result = await jsonStorage.findWithPagination('announcements.json', page, limit, filter)

    const response: PaginatedResponse<Announcement> = {
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('获取公告列表失败:', error)
    return NextResponse.json(
      { error: '获取公告列表失败' },
      { status: 500 }
    )
  }
}

// 创建公告
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    
    // 验证必填字段
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: '标题和内容为必填项' },
        { status: 400 }
      )
    }

    // 创建新公告
    const newAnnouncement = await jsonStorage.create('announcements.json', {
      ...body,
      type: body.type || 'normal',
      priority: body.priority || 1,
      isActive: body.isActive ?? true
    })

    return NextResponse.json({
      success: true,
      data: newAnnouncement,
      message: '公告创建成功'
    })
  } catch (error) {
    console.error('创建公告失败:', error)
    return NextResponse.json(
      { error: '创建公告失败' },
      { status: 500 }
    )
  }
} 