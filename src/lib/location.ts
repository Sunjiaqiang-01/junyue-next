// 位置相关工具函数

export interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
  address?: string
  timestamp?: number
  source?: 'gps' | 'ip' | string
}

export interface DistanceResult {
  distance: number
  unit: string
  userLocation: LocationData
  technicianLocation: LocationData
}

/**
 * 获取用户当前位置
 * @param options 地理位置选项
 * @returns Promise<LocationData>
 */
export function getUserLocation(options?: PositionOptions): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理位置功能'))
      return
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5分钟缓存
      ...options
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        })
      },
      (error) => {
        let errorMessage = '获取位置失败'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '用户拒绝了位置访问请求'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置信息不可用'
            break
          case error.TIMEOUT:
            errorMessage = '获取位置超时'
            break
        }
        
        reject(new Error(errorMessage))
      },
      defaultOptions
    )
  })
}

/**
 * 使用百度地图逆地理编码获取地址信息
 * @param latitude 纬度
 * @param longitude 经度
 * @returns Promise<LocationData>
 */
export async function getBaiduGeocodingInfo(latitude: number, longitude: number): Promise<LocationData> {
  try {
    const response = await fetch(`/api/distance-calculation?lat=${latitude}&lng=${longitude}`)
    
    if (!response.ok) {
      throw new Error('百度地图逆地理编码失败')
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('百度地图逆地理编码失败:', error)
    // 即使逆地理编码失败，也返回基本的位置信息
    return {
      latitude,
      longitude,
      source: 'gps',
      address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    }
  }
}

/**
 * 获取用户位置（仅使用GPS定位）
 * @param options 地理位置选项
 * @returns Promise<LocationData>
 */
export async function getUserLocationWithGeocoding(options?: PositionOptions): Promise<LocationData> {
  try {
    // 获取GPS位置
    const gpsLocation = await getUserLocation(options)
    
    // 尝试获取地址信息
    try {
      const locationWithAddress = await getBaiduGeocodingInfo(gpsLocation.latitude, gpsLocation.longitude)
      return {
        ...gpsLocation,
        ...locationWithAddress,
        source: 'gps'
      }
    } catch (geocodingError) {
      console.warn('获取地址信息失败，使用基本GPS信息:', geocodingError)
      return { ...gpsLocation, source: 'gps' }
    }
  } catch (gpsError) {
    console.error('GPS定位失败:', gpsError)
    throw new Error('无法获取位置信息，请允许位置访问权限。确保您的设备支持GPS定位，并且浏览器有位置访问权限。')
  }
}

/**
 * 计算用户与技师的距离
 * @param userLocation 用户位置
 * @param technicianLocation 技师位置
 * @returns Promise<DistanceResult>
 */
export async function calculateDistance(
  userLocation: LocationData,
  technicianLocation: LocationData
): Promise<DistanceResult> {
  try {
    const response = await fetch('/api/distance-calculation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userLatitude: userLocation.latitude,
        userLongitude: userLocation.longitude,
        technicianLatitude: technicianLocation.latitude,
        technicianLongitude: technicianLocation.longitude,
        coordinateSystem: 'wgs84' // 默认使用标准GPS坐标系
      }),
    })

    if (!response.ok) {
      throw new Error('距离计算失败')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('距离计算失败:', error)
    throw error
  }
}

/**
 * 格式化距离显示
 * @param distance 距离（千米）
 * @returns 格式化的距离字符串
 */
export function formatDistance(distance: number): string {
  if (distance < 0.1) {
    return '<100m'
  } else if (distance < 1) {
    return `${Math.round(distance * 1000)}m`
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`
  } else {
    return `${Math.round(distance)}km`
  }
}

/**
 * 位置存储管理
 */
export class LocationStorage {
  private static readonly STORAGE_KEY = 'user_location'
  private static readonly CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

  /**
   * 保存位置到本地存储
   */
  static save(location: LocationData): void {
    try {
      const data = {
        ...location,
        timestamp: Date.now()
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.warn('保存位置信息失败:', error)
    }
  }

  /**
   * 从本地存储获取位置
   */
  static get(): LocationData | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return null

      const data = JSON.parse(stored)
      const now = Date.now()
      
      // 检查缓存是否过期
      if (data.timestamp && (now - data.timestamp) > this.CACHE_DURATION) {
        this.clear()
        return null
      }

      return data
    } catch (error) {
      console.warn('获取存储的位置信息失败:', error)
      return null
    }
  }

  /**
   * 清除存储的位置信息
   */
  static clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.warn('清除位置信息失败:', error)
    }
  }

  /**
   * 获取缓存的位置或重新获取
   */
  static async getCachedOrFresh(options?: PositionOptions): Promise<LocationData> {
    // 先尝试获取缓存
    const cached = this.get()
    if (cached) {
      return cached
    }

    // 缓存不存在或已过期，重新获取
    const fresh = await getUserLocationWithGeocoding(options)
    this.save(fresh)
    return fresh
  }
}

/**
 * 位置权限检查
 */
export function checkLocationPermission(): Promise<PermissionState> {
  return new Promise((resolve) => {
    if (!navigator.permissions) {
      resolve('prompt')
      return
    }

    navigator.permissions.query({ name: 'geolocation' })
      .then((result) => {
        resolve(result.state)
      })
      .catch(() => {
        resolve('prompt')
      })
  })
}

/**
 * 请求位置权限
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const permission = await checkLocationPermission()
    
    if (permission === 'granted') {
      return true
    }
    
    if (permission === 'denied') {
      return false
    }

    // 权限状态为 prompt，尝试获取位置来触发权限请求
    await getUserLocation({ timeout: 5000 })
    return true
  } catch (error) {
    console.warn('位置权限请求失败:', error)
    return false
  }
} 