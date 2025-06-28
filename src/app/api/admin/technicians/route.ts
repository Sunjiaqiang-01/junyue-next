import { NextRequest, NextResponse } from 'next/server'
import { jsonStorage } from '@/lib/json-storage'
import { Technician, PaginatedResponse } from '@/lib/data/types'
import { verifyAdmin } from '@/lib/auth'

// 获取技师列表（管理后台）
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
    const city = searchParams.get('city')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')

    // 构建筛选函数
    const filter = (technician: Technician) => {
      if (city && !technician.cities.includes(city)) return false
      if (isActive !== null && technician.isActive !== (isActive === 'true')) return false
      if (search && !technician.nickname.toLowerCase().includes(search.toLowerCase())) return false
      return true
    }

    // 获取分页数据
    const result = await jsonStorage.findWithPagination('technicians.json', page, limit, filter)

    const response: PaginatedResponse<Technician> = {
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('获取技师列表失败:', error)
    return NextResponse.json(
      { error: '获取技师列表失败' },
      { status: 500 }
    )
  }
}

// 创建技师
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    
    // 验证必填字段
    if (!body.nickname || !body.age || !body.cities || body.cities.length === 0) {
      return NextResponse.json(
        { error: '昵称、年龄和服务城市为必填项' },
        { status: 400 }
      )
    }

    // 创建新技师
    const newTechnician = await jsonStorage.create('technicians.json', {
      ...body,
      isActive: body.isActive ?? true,
      isNew: body.isNew ?? false,
      isRecommended: body.isRecommended ?? false,
      media: body.media || []
    })

    return NextResponse.json({
      success: true,
      data: newTechnician,
      message: '技师创建成功'
    })
  } catch (error) {
    console.error('创建技师失败:', error)
    return NextResponse.json(
      { error: '创建技师失败' },
      { status: 500 }
    )
  }
} 