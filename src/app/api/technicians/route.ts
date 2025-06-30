import { NextRequest, NextResponse } from 'next/server'
import { jsonStorage } from '@/lib/json-storage'
import { Technician, TechnicianFilters, PaginatedResponse, TechnicianMedia } from '@/lib/data/types'
import fs from 'fs'

// 添加简单日志功能
function logDebug(message: string, data?: any) {
  const logPath = './logs/debug.log'
  const timestamp = new Date().toISOString()
  const logMessage = `${timestamp} - ${message} ${data ? JSON.stringify(data) : ''}\n`
  
  try {
    fs.appendFileSync(logPath, logMessage)
  } catch (error) {
    console.error('Failed to write debug log:', error)
  }
}

// 获取技师列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    logDebug('Technician API request URL:', request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '999') // 修改为999，实际上无上限
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
    
    // 添加日志记录技师数量
    logDebug('Technicians found:', { total: result.total, returned: result.data.length })
    
    // 记录图片URL示例
    if (result.data.length > 0) {
      const sampleTechnician = result.data[0]
      if (sampleTechnician.media && sampleTechnician.media.length > 0) {
        logDebug('Sample media URLs:', sampleTechnician.media.slice(0, 2).map((m: TechnicianMedia) => m.path))
      }
    }

    const response: PaginatedResponse<Technician> = {
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('获取技师列表失败:', error)
    logDebug('Technician API error:', error)
    return NextResponse.json(
      { error: '获取技师列表失败' },
      { status: 500 }
    )
  }
} 