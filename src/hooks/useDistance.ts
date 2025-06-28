import { useState, useCallback, useMemo } from 'react'
import { LocationData, DistanceResult, calculateDistance, formatDistance } from '@/lib/location'
import { Technician } from '@/lib/data/types'

export interface UseDistanceOptions {
  userLocation?: LocationData | null
  autoCalculate?: boolean
}

export interface UseDistanceReturn {
  distances: Map<string, number>
  loading: boolean
  error: string | null
  
  // 方法
  calculateDistanceToTechnician: (technician: Technician) => Promise<number | null>
  calculateDistanceToLocation: (targetLocation: LocationData) => Promise<number | null>
  getFormattedDistance: (distance: number) => string
  getDistance: (technicianId: string) => number | null
  clearDistances: () => void
  
  // 额外的工具方法
  calculateMultipleDistances: (technicians: Technician[]) => Promise<void>
  sortTechniciansByDistance: (technicians: Technician[]) => Technician[]
  statistics: {
    count: number
    average: number
    min: number
    max: number
    nearest: string | null
  }
}

export function useDistance(options: UseDistanceOptions = {}): UseDistanceReturn {
  const { userLocation, autoCalculate = false } = options

  const [distances, setDistances] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 计算到技师的距离
  const calculateDistanceToTechnician = useCallback(async (technician: Technician): Promise<number | null> => {
    if (!userLocation || !technician.latitude || !technician.longitude) {
      return null
    }

    try {
      setLoading(true)
      setError(null)

      const technicianLocation: LocationData = {
        latitude: parseFloat(technician.latitude.toString()),
        longitude: parseFloat(technician.longitude.toString())
      }

      const result: DistanceResult = await calculateDistance(userLocation, technicianLocation)
      
      // 更新距离缓存
      setDistances(prev => new Map(prev.set(technician.id, result.distance)))
      
      return result.distance
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '距离计算失败'
      setError(errorMessage)
      console.error('计算距离失败:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [userLocation])

  // 计算到指定位置的距离
  const calculateDistanceToLocation = useCallback(async (targetLocation: LocationData): Promise<number | null> => {
    if (!userLocation) {
      return null
    }

    try {
      setLoading(true)
      setError(null)

      const result: DistanceResult = await calculateDistance(userLocation, targetLocation)
      return result.distance
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '距离计算失败'
      setError(errorMessage)
      console.error('计算距离失败:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [userLocation])

  // 获取格式化的距离字符串
  const getFormattedDistance = useCallback((distance: number): string => {
    return formatDistance(distance)
  }, [])

  // 获取指定技师的距离
  const getDistance = useCallback((technicianId: string): number | null => {
    return distances.get(technicianId) || null
  }, [distances])

  // 清除所有距离缓存
  const clearDistances = useCallback(() => {
    setDistances(new Map())
    setError(null)
  }, [])

  // 批量计算多个技师的距离
  const calculateMultipleDistances = useCallback(async (technicians: Technician[]): Promise<void> => {
    if (!userLocation || technicians.length === 0) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const promises = technicians.map(async (technician) => {
        if (!technician.latitude || !technician.longitude) {
          return { id: technician.id, distance: null }
        }

        try {
          const technicianLocation: LocationData = {
            latitude: parseFloat(technician.latitude.toString()),
            longitude: parseFloat(technician.longitude.toString())
          }

          const result: DistanceResult = await calculateDistance(userLocation, technicianLocation)
          return { id: technician.id, distance: result.distance }
        } catch (error) {
          console.warn(`计算技师 ${technician.nickname} 的距离失败:`, error)
          return { id: technician.id, distance: null }
        }
      })

      const results = await Promise.allSettled(promises)
      
      const newDistances = new Map(distances)
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.distance !== null) {
          newDistances.set(result.value.id, result.value.distance)
        }
      })

      setDistances(newDistances)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '批量计算距离失败'
      setError(errorMessage)
      console.error('批量计算距离失败:', err)
    } finally {
      setLoading(false)
    }
  }, [userLocation, distances])

  // 返回排序后的技师列表（按距离排序）
  const sortTechniciansByDistance = useCallback((technicians: Technician[]): Technician[] => {
    return [...technicians].sort((a, b) => {
      const distanceA = distances.get(a.id)
      const distanceB = distances.get(b.id)

      // 如果都有距离，按距离排序
      if (distanceA !== undefined && distanceB !== undefined) {
        return distanceA - distanceB
      }

      // 有距离的排在前面
      if (distanceA !== undefined && distanceB === undefined) {
        return -1
      }
      if (distanceA === undefined && distanceB !== undefined) {
        return 1
      }

      // 都没有距离，保持原顺序
      return 0
    })
  }, [distances])

  // 计算统计信息
  const statistics = useMemo(() => {
    const validDistances = Array.from(distances.values()).filter(d => d !== null)
    
    if (validDistances.length === 0) {
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        nearest: null
      }
    }

    const average = validDistances.reduce((sum, d) => sum + d, 0) / validDistances.length
    const min = Math.min(...validDistances)
    const max = Math.max(...validDistances)
    
    // 找到最近的技师
    let nearestId = null
    let nearestDistance = Infinity
    for (const [id, distance] of distances.entries()) {
      if (distance !== null && distance < nearestDistance) {
        nearestDistance = distance
        nearestId = id
      }
    }

    return {
      count: validDistances.length,
      average: Math.round(average * 100) / 100,
      min,
      max,
      nearest: nearestId
    }
  }, [distances])

  return {
    distances,
    loading,
    error,
    calculateDistanceToTechnician,
    calculateDistanceToLocation,
    getFormattedDistance,
    getDistance,
    clearDistances,
    // 额外的工具方法
    calculateMultipleDistances,
    sortTechniciansByDistance,
    statistics
  }
} 