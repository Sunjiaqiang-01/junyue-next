import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  LocationData, 
  getUserLocationWithGeocoding, 
  LocationStorage,
  checkLocationPermission,
  requestLocationPermission
} from '@/lib/location'

export interface UseLocationOptions {
  autoFetch?: boolean
  enableCache?: boolean
  watchPosition?: boolean
}

export interface UseLocationReturn {
  location: LocationData | null
  loading: boolean
  error: string | null
  permission: PermissionState | null
  accuracy: number | null
  lastUpdated: number | null
  
  // 方法
  getCurrentLocation: () => Promise<void>
  requestPermission: () => Promise<boolean>
  clearLocation: () => void
  refreshLocation: () => Promise<void>
}

export function useLocation(options: UseLocationOptions = {}): UseLocationReturn {
  const {
    autoFetch = false,
    enableCache = true,
    watchPosition = false
  } = options

  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permission, setPermission] = useState<PermissionState | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  
  const watchIdRef = useRef<number | null>(null)

  // 检查位置权限
  const checkPermission = useCallback(async () => {
    try {
      const permissionState = await checkLocationPermission()
      setPermission(permissionState)
      return permissionState
    } catch (error) {
      console.warn('检查位置权限失败:', error)
      return 'prompt' as PermissionState
    }
  }, [])

  // 请求位置权限
  const requestPermissionHandler = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await requestLocationPermission()
      if (granted) {
        await checkPermission()
      }
      return granted
    } catch (error) {
      console.error('请求位置权限失败:', error)
      return false
    }
  }, [checkPermission])

  // 获取当前位置
  const getCurrentLocation = useCallback(async () => {
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      // 如果启用缓存，先尝试获取缓存的位置
      if (enableCache) {
        const cached = LocationStorage.get()
        if (cached) {
          setLocation(cached)
          setLastUpdated(cached.timestamp || Date.now())
          setLoading(false)
          return
        }
      }

      // 获取新的位置
      const newLocation = await getUserLocationWithGeocoding({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1分钟
      })

      setLocation(newLocation)
      setLastUpdated(Date.now())

      // 保存到缓存
      if (enableCache) {
        LocationStorage.save(newLocation)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取位置失败'
      setError(errorMessage)
      console.error('获取位置失败:', err)
    } finally {
      setLoading(false)
    }
  }, [loading, enableCache])

  // 刷新位置
  const refreshLocation = useCallback(async () => {
    if (enableCache) {
      LocationStorage.clear()
    }
    await getCurrentLocation()
  }, [getCurrentLocation, enableCache])

  // 清除位置
  const clearLocation = useCallback(() => {
    setLocation(null)
    setError(null)
    setLastUpdated(null)
    
    if (enableCache) {
      LocationStorage.clear()
    }

    // 停止位置监听
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [enableCache])

  // 开始位置监听
  const startWatching = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current !== null) {
      return
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          source: 'gps'
        }

        setLocation(newLocation)
        setLastUpdated(Date.now())

        if (enableCache) {
          LocationStorage.save(newLocation)
        }
      },
      (error) => {
        console.warn('位置监听失败:', error)
        setError('位置监听失败')
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    )
  }, [enableCache])

  // 停止位置监听
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  // 初始化
  useEffect(() => {
    checkPermission()

    // 如果启用自动获取，则获取位置
    if (autoFetch) {
      getCurrentLocation()
    }

    // 如果启用位置监听，则开始监听
    if (watchPosition) {
      startWatching()
    }

    // 清理函数
    return () => {
      stopWatching()
    }
  }, [autoFetch, watchPosition, checkPermission, getCurrentLocation, startWatching, stopWatching])

  // 计算精度
  const accuracy = location?.accuracy || null

  return {
    location,
    loading,
    error,
    permission,
    accuracy,
    lastUpdated,
    getCurrentLocation,
    requestPermission: requestPermissionHandler,
    clearLocation,
    refreshLocation
  }
} 