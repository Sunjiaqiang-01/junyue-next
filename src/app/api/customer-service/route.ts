import { NextRequest, NextResponse } from 'next/server'
import { jsonStorage } from '@/lib/json-storage'
import { CustomerService } from '@/lib/data/types'

// 获取客服信息
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')

    if (city) {
      // 获取指定城市的客服信息
      const customerService = await jsonStorage.findAll('customer-service.json', (cs: CustomerService) => {
        return cs.city === city && cs.isActive
      })

      if (customerService.length === 0) {
        return NextResponse.json(
          { error: '该城市暂无客服信息' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: customerService[0]
      })
    } else {
      // 获取所有活跃的客服信息
      const customerServices = await jsonStorage.findAll('customer-service.json', (cs: CustomerService) => {
        return cs.isActive
      })

      return NextResponse.json({
        success: true,
        data: customerServices
      })
    }
  } catch (error) {
    console.error('获取客服信息失败:', error)
    return NextResponse.json(
      { error: '获取客服信息失败' },
      { status: 500 }
    )
  }
} 