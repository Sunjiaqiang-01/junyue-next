import { NextRequest, NextResponse } from 'next/server'

// 地球半径（千米）
const EARTH_RADIUS = 6371

/**
 * 使用Haversine公式计算两点间距离
 * @param lat1 纬度1
 * @param lon1 经度1  
 * @param lat2 纬度2
 * @param lon2 经度2
 * @returns 距离（千米）
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return EARTH_RADIUS * c
}

/**
 * 角度转弧度
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * 百度坐标系转换为标准GPS坐标系（WGS84）
 * 这是一个简化的转换，实际项目中建议使用专业的坐标转换库
 */
function convertBaiduToWGS84(bdLat: number, bdLon: number) {
  const x = bdLon - 0.0065
  const y = bdLat - 0.006
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * Math.PI)
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * Math.PI)
  
  return {
    latitude: z * Math.sin(theta),
    longitude: z * Math.cos(theta)
  }
}

// POST 计算距离
export async function POST(request: NextRequest) {
  try {
    // 检查请求体是否存在
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: '无效的请求格式，需要JSON格式' },
        { status: 400 }
      )
    }

    let body
    try {
      const text = await request.text()
      if (!text || text.trim() === '') {
        return NextResponse.json(
          { error: '请求体为空，无法计算距离' },
          { status: 400 }
        )
      }
      body = JSON.parse(text)
    } catch (parseError) {
      console.error('JSON解析失败:', parseError)
      return NextResponse.json(
        { error: '无效的JSON格式' },
        { status: 400 }
      )
    }

    const { userLatitude, userLongitude, technicianLatitude, technicianLongitude, coordinateSystem = 'wgs84' } = body

    // 验证参数
    if (
      typeof userLatitude !== 'number' || 
      typeof userLongitude !== 'number' || 
      typeof technicianLatitude !== 'number' || 
      typeof technicianLongitude !== 'number'
    ) {
      return NextResponse.json(
        { error: '缺少必要的位置参数或参数格式错误' },
        { status: 400 }
      )
    }

    // 验证坐标范围
    if (
      Math.abs(userLatitude) > 90 || 
      Math.abs(userLongitude) > 180 ||
      Math.abs(technicianLatitude) > 90 || 
      Math.abs(technicianLongitude) > 180
    ) {
      return NextResponse.json(
        { error: '坐标值超出有效范围' },
        { status: 400 }
      )
    }

    let userLat = userLatitude
    let userLon = userLongitude
    let techLat = technicianLatitude
    let techLon = technicianLongitude

    // 如果是百度坐标系，转换为WGS84
    if (coordinateSystem === 'baidu') {
      const userWGS84 = convertBaiduToWGS84(userLatitude, userLongitude)
      const techWGS84 = convertBaiduToWGS84(technicianLatitude, technicianLongitude)
      
      userLat = userWGS84.latitude
      userLon = userWGS84.longitude
      techLat = techWGS84.latitude
      techLon = techWGS84.longitude
    }

    // 计算距离
    const distance = calculateDistance(userLat, userLon, techLat, techLon)

    // 获取地址信息（可选）
    let addressInfo = null
    try {
      addressInfo = await getBaiduGeocoding(userLat, userLon)
    } catch (error) {
      console.warn('获取地址信息失败:', error)
    }

    const result = {
      distance: Math.round(distance * 100) / 100, // 保留两位小数
      unit: 'km',
      userLocation: {
        latitude: userLat,
        longitude: userLon,
        address: addressInfo?.address || `${userLat.toFixed(6)}, ${userLon.toFixed(6)}`
      },
      technicianLocation: {
        latitude: techLat,
        longitude: techLon
      }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('距离计算失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误，距离计算失败' },
      { status: 500 }
    )
  }
}

// GET 使用百度地图API获取位置信息
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')

    if (!lat || !lng) {
      return NextResponse.json(
        { error: '缺少纬度或经度参数' },
        { status: 400 }
      )
    }

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: '无效的坐标格式' },
        { status: 400 }
      )
    }

    const addressInfo = await getBaiduGeocoding(latitude, longitude)

    return NextResponse.json({
      latitude,
      longitude,
      address: addressInfo?.address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      province: addressInfo?.province,
      city: addressInfo?.city,
      district: addressInfo?.district,
      source: 'baidu_geocoding'
    })

  } catch (error) {
    console.error('逆地理编码失败:', error)
    return NextResponse.json(
      { error: '逆地理编码失败' },
      { status: 500 }
    )
  }
}

// 百度地图逆地理编码API
async function getBaiduGeocoding(lat: number, lng: number) {
  const ak = process.env.BAIDU_MAP_AK || 'qX0HXOj8pLLi0QdvvMpfScXdh6SllUqd'
  const url = `https://api.map.baidu.com/reverse_geocoding/v3/?ak=${ak}&output=json&coordtype=wgs84ll&location=${lat},${lng}`
  
  try {
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status === 0) {
      return {
        address: data.result.formatted_address,
        province: data.result.addressComponent.province,
        city: data.result.addressComponent.city,
        district: data.result.addressComponent.district
      }
    } else {
      console.warn('百度地图API错误:', data.message)
      return null
    }
  } catch (error) {
    console.error('百度地图API调用失败:', error)
    return null
  }
} 