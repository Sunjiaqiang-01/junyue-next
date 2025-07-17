import { NextRequest, NextResponse } from 'next/server'
import { jsonStorage } from '@/lib/json-storage'
import { CustomerService } from '@/lib/data/types'

// 获取客服信息
export async function GET(request: NextRequest) {
  try {
    // 获取URL参数
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')

    // 获取所有客服数据
    const customerServices = await jsonStorage.findAll('customer-service.json')
    
    // 如果指定了城市，过滤出支持该城市的客服
    let filteredServices = customerServices
    if (city) {
      // 处理江苏省内城市，映射到江苏客服
      const jiangsuCities = ['nanjing', 'suzhou', 'wuxi', 'changzhou', 'xuzhou', 'nantong', 'lianyungang', 'huaian', 'yancheng', 'yangzhou', 'zhenjiang', 'taizhou', 'suqian']
      if (jiangsuCities.includes(city)) {
        filteredServices = customerServices.filter(service => 
          service.city === '江苏' && service.isActive
        )
      } else {
        // 其他城市正常过滤
        filteredServices = customerServices.filter(service => 
          (service.supportCities?.includes(city) || service.city === city) && service.isActive
        )
      }
    } else {
      // 不指定城市则只返回活跃的客服
      filteredServices = customerServices.filter(service => service.isActive)
    }

      return NextResponse.json({
        success: true,
      data: filteredServices
      })
  } catch (error) {
    console.error('获取客服信息失败:', error)
    return NextResponse.json(
      { error: '获取客服信息失败' },
      { status: 500 }
    )
  }
} 