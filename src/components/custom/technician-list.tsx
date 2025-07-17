'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { TechnicianCard } from '@/components/ui/technician-card'
import { TechnicianFilters } from '@/components/ui/technician-filters'
import { LocationPermissionGuide } from '@/components/ui/location-permission-guide'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useLocation } from '@/hooks/useLocation'
import { useDistance } from '@/hooks/useDistance'
import { Technician, TechnicianFilters as FilterType } from '@/lib/data/types'

// 懒加载技师卡片组件
function LazyTechnicianCard({ 
  technician, 
  userLocation
}: { 
  technician: Technician, 
  userLocation?: any
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    if (!cardRef.current) return
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect() // 一旦可见，就不再观察
        }
      })
    }, {
      root: null, // 使用视口作为根
      rootMargin: '200px 0px', // 在元素进入视口前200px开始加载
      threshold: 0.1 // 当10%的元素可见时触发
    })
    
    observer.observe(cardRef.current)
    
    return () => observer.disconnect()
  }, [])
  
  return (
    <div ref={cardRef}>
      {isVisible ? (
        <TechnicianCard
          technician={technician}
          userLocation={userLocation}
        />
      ) : (
        <div className="h-[300px] w-full bg-gray-100 rounded-lg"></div>
      )}
    </div>
  )
}

interface TechnicianListProps {
  technicians?: Technician[] // 可选，如果不传则自动获取
  className?: string
}

export function TechnicianList({ technicians: propTechnicians, className = '' }: TechnicianListProps) {
  const [technicians, setTechnicians] = useState<Technician[]>(propTechnicians || [])
  const [loading, setLoading] = useState(!propTechnicians) // 如果没有传入数据则需要加载
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterType>({
    isActive: true
  })
  const [sortBy, setSortBy] = useState<'distance' | 'newest' | 'recommended'>('distance')
  const [showLocationGuide, setShowLocationGuide] = useState(false)

  // 如果没有传入technicians，则自动获取
  useEffect(() => {
    if (!propTechnicians) {
      fetchTechnicians()
    }
  }, [propTechnicians])

  // 获取技师数据
  const fetchTechnicians = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/technicians')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setTechnicians(data.technicians || data.data || [])
    } catch (err) {
      console.error('获取技师列表失败:', err)
      setError('获取技师列表失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const { 
    location, 
    loading: locationLoading, 
    error: locationError,
    permission,
    getCurrentLocation,
    clearLocation 
  } = useLocation({ 
    autoFetch: false, 
    enableCache: true 
  })

  const { 
    distances, 
    loading: distanceLoading, 
    error: distanceError,
    calculateMultipleDistances,
    sortTechniciansByDistance,
    getDistance 
  } = useDistance({ 
    userLocation: location 
  })

  // 自动计算距离
  useEffect(() => {
    if (location && technicians.length > 0) {
      calculateMultipleDistances(technicians)
    }
  }, [location, technicians, calculateMultipleDistances])

  // 过滤技师
  const filteredTechnicians = useMemo(() => {
    let filtered = technicians.filter(technician => {
      // 基本过滤条件
      if (filters.isActive !== undefined && technician.isActive !== filters.isActive) {
        return false
      }
      if (filters.isNew && !technician.isNew) {
        return false
      }
      if (filters.isRecommended && !technician.isRecommended) {
        return false
      }
      
      // 城市过滤 - 使用cities数组
      if (filters.city && !technician.cities.includes(filters.city)) {
        return false
      }
      
      // 搜索过滤
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const searchableText = [
          technician.nickname,
          technician.features,
          technician.address,
          technician.age.toString(),
          technician.height.toString(),
          technician.weight.toString()
        ].join(' ').toLowerCase()
        
        if (!searchableText.includes(searchTerm)) {
          return false
        }
      }
      
      return true
    })

    // 排序
    switch (sortBy) {
      case 'distance':
        if (location) {
          filtered = sortTechniciansByDistance(filtered)
        }
        break
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'recommended':
        filtered.sort((a, b) => {
          if (a.isRecommended && !b.isRecommended) return -1
          if (!a.isRecommended && b.isRecommended) return 1
          return 0
        })
        break
    }

    return filtered
  }, [technicians, filters, sortBy, location, sortTechniciansByDistance])

  const handleLocationGranted = (position: GeolocationPosition) => {
    setShowLocationGuide(false)
    // 位置将通过useLocation hook自动更新
  }

  const handleLocationDenied = (error: GeolocationPositionError) => {
    console.error('位置获取失败:', error)
    // 错误已经在LocationPermissionGuide中处理
  }

  const handleGetLocation = async () => {
    if (permission === 'denied') {
      setShowLocationGuide(true)
      return
    }
    
    try {
      await getCurrentLocation()
    } catch (error) {
      console.error('获取位置失败:', error)
      setShowLocationGuide(true)
    }
  }

  const getLocationStatus = () => {
    if (locationLoading) return '正在获取位置...'
    if (locationError) return '位置获取失败'
    if (location) return `📍 ${location.address || '已获取位置'}`
    return '未获取位置'
  }

  const getLocationStatusColor = () => {
    if (locationLoading) return 'text-blue-600'
    if (locationError) return 'text-red-600'
    if (location) return 'text-green-600'
    return 'text-gray-600'
  }

  // 加载状态
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载技师信息...</p>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={fetchTechnicians} variant="outline">
          重新加载
        </Button>
      </div>
    )
  }

  if (showLocationGuide) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <Button 
            onClick={() => setShowLocationGuide(false)}
            variant="outline"
            className="mb-4"
          >
            ← 返回技师列表
          </Button>
        </div>
        <LocationPermissionGuide 
          onLocationGranted={handleLocationGranted}
          onLocationDenied={handleLocationDenied}
        />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 位置功能已禁用 - 状态栏移除 */}

      {/* 筛选器 */}
      <TechnicianFilters 
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* 排序选项 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">排序方式：</span>
          <div className="flex space-x-1">
            <Button
              variant={sortBy === 'distance' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('distance')}
              disabled={!location}
            >
              距离
            </Button>
            <Button
              variant={sortBy === 'newest' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('newest')}
            >
              最新
            </Button>
            <Button
              variant={sortBy === 'recommended' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('recommended')}
            >
              推荐
            </Button>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          共找到 {filteredTechnicians.length} 位技师
          {location && (
            <span className="ml-2">
              已计算 {Array.from(distances.keys()).length} 位距离
            </span>
          )}
        </div>
      </div>

      {/* 技师网格 - 使用懒加载 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTechnicians.map((technician) => (
          <LazyTechnicianCard
            key={technician.id}
            technician={technician}
            userLocation={location}
          />
        ))}
      </div>

      {/* 空状态 */}
      {filteredTechnicians.length === 0 && technicians.length > 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">没有找到符合条件的技师</p>
          <Button 
            onClick={() => {
              setFilters({ isActive: true })
              setSortBy('distance')
            }}
            variant="outline"
          >
            清除筛选条件
          </Button>
        </Card>
      )}

      {/* 完全没有数据的空状态 */}
      {technicians.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <div className="text-6xl mb-4">😔</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            暂无技师信息
          </h3>
          <p className="text-gray-500 mb-4">
            请稍后再试或联系客服
          </p>
          <Button onClick={fetchTechnicians} variant="outline">
            重新加载
          </Button>
        </Card>
      )}

      {/* 位置服务提示已移除 */}
    </div>
  )
} 