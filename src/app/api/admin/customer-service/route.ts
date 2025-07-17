import { NextRequest, NextResponse } from 'next/server'
import { jsonStorage } from '@/lib/json-storage'
import { CustomerService, PaginatedResponse } from '@/lib/data/types'
import { verifyAdmin } from '@/lib/auth'

// 获取客服列表（管理后台）
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

    // 构建筛选函数
    const filter = (customerService: CustomerService) => {
      if (city && customerService.city !== city) return false
      if (isActive !== null && customerService.isActive !== (isActive === 'true')) return false
      return true
    }

    // 获取分页数据
    const result = await jsonStorage.findWithPagination('customer-service.json', page, limit, filter)

    const response: PaginatedResponse<CustomerService> = {
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('获取客服列表失败:', error)
    return NextResponse.json(
      { error: '获取客服列表失败' },
      { status: 500 }
    )
  }
}

// 创建客服
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    
    // 验证必填字段
    if (!body.city || !body.wechatId) {
      return NextResponse.json(
        { error: '城市和微信号为必填项' },
        { status: 400 }
      )
    }

    // 验证supportCities字段
    if (body.city === '江苏' && (!body.supportCities || body.supportCities.length === 0)) {
      return NextResponse.json(
        { error: '江苏客服必须选择支持的城市' },
        { status: 400 }
      )
    }

    // 检查城市是否已存在客服（江苏允许多个客服）
    if (body.city !== '江苏') {
    const existingCustomerService = await jsonStorage.findAll('customer-service.json', (cs: CustomerService) => {
      return cs.city === body.city
    })

    if (existingCustomerService.length > 0) {
      return NextResponse.json(
        { error: '该城市已存在客服' },
        { status: 400 }
      )
      }
    }

    // 如果是杭州或郑州，自动设置supportCities
    if (body.city === '杭州' && (!body.supportCities || body.supportCities.length === 0)) {
      body.supportCities = ['hangzhou'];
    } else if (body.city === '郑州' && (!body.supportCities || body.supportCities.length === 0)) {
      body.supportCities = ['zhengzhou'];
    }

    // 创建新客服
    const newCustomerService = await jsonStorage.create('customer-service.json', {
      ...body,
      workHours: body.workHours || '9:00-23:00',
      isActive: body.isActive ?? true,
      supportCities: body.supportCities || []
    })

    return NextResponse.json({
      success: true,
      data: newCustomerService,
      message: '客服创建成功'
    })
  } catch (error) {
    console.error('创建客服失败:', error)
    return NextResponse.json(
      { error: '创建客服失败' },
      { status: 500 }
    )
  }
} 