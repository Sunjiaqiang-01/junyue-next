import { NextRequest, NextResponse } from 'next/server'
import { jsonStorage } from '@/lib/json-storage'
import { Technician, TechnicianFilters, PaginatedResponse } from '@/lib/data/types'

// 获取技师列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const city = searchParams.get('city')
    const isNewParam = searchParams.get('isNew')
    const isRecommendedParam = searchParams.get('isRecommended')
    const search = searchParams.get('search')

    // 构建筛选函数
    const filter = (technician: Technician) => {
      // 基本条件：必须是激活状态
      if (!technician.isActive) return false
      
      // 城市筛选：只有当明确指定城市时才筛选
      if (city && !technician.cities.includes(city)) return false
      
      // 新技师筛选：只有当明确传递 isNew=true 时才筛选新技师
      if (isNewParam === 'true' && !technician.isNew) return false
      
      // 推荐技师筛选：只有当明确传递 isRecommended=true 时才筛选推荐技师
      if (isRecommendedParam === 'true' && !technician.isRecommended) return false
      
      // 搜索筛选：只有当提供搜索关键词时才筛选
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