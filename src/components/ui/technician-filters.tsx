'use client'

import React from 'react'
import { Button } from './button'
import { Badge } from './badge'
import type { TechnicianFilters, CityType } from '@/lib/data/types'
import { getCityThemeColor } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface TechnicianFiltersProps {
  filters: TechnicianFilters
  onFiltersChange: (filters: TechnicianFilters) => void
  className?: string
}

// 城市配置
const CITIES: { key: CityType; name: string; color: string }[] = [
  { key: 'nanjing', name: '南京', color: getCityThemeColor('nanjing') },
  { key: 'suzhou', name: '苏州', color: getCityThemeColor('suzhou') },
  { key: 'hangzhou', name: '杭州', color: getCityThemeColor('hangzhou') },
  { key: 'wuhan', name: '武汉', color: getCityThemeColor('wuhan') },
  { key: 'zhengzhou', name: '郑州', color: getCityThemeColor('zhengzhou') },
]

// 搜索提示文本
const SEARCH_PLACEHOLDER = "搜索技师昵称、位置、年龄、身高、体重、服务特色..."

export function TechnicianFilters({ filters, onFiltersChange, className }: TechnicianFiltersProps) {
  
  const handleCityChange = (city: CityType) => {
    onFiltersChange({
      ...filters,
      city: filters.city === city ? undefined : city
    })
  }

  const handleSearchChange = (search: string) => {
    onFiltersChange({
      ...filters,
      search: search.trim() || undefined
    })
  }

  const handleSpecialFilter = (type: 'isNew' | 'isRecommended') => {
    onFiltersChange({
      ...filters,
      [type]: filters[type] ? undefined : true
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      isActive: true // 保持只显示活跃技师
    })
  }

  const hasActiveFilters = !!(filters.city || filters.search || filters.isNew || filters.isRecommended)

  return (
    <div className={cn("bg-white p-4 rounded-lg shadow-sm border", className)}>
      <div className="space-y-4">
        {/* 标题和清除按钮 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">筛选技师</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-gray-500 hover:text-primary"
            >
              清除筛选
            </Button>
          )}
        </div>

        {/* 城市筛选 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">选择城市</h4>
          <div className="flex flex-wrap gap-2">
            {CITIES.map((city) => (
              <Button
                key={city.key}
                variant={filters.city === city.key ? "default" : "outline"}
                size="sm"
                onClick={() => handleCityChange(city.key)}
                className={cn(
                  "text-xs h-8",
                  filters.city === city.key && `bg-[${city.color}] hover:bg-[${city.color}]/90 border-[${city.color}]`
                )}
                style={{
                  backgroundColor: filters.city === city.key ? city.color : undefined,
                  borderColor: filters.city === city.key ? city.color : undefined,
                }}
              >
                {city.name}
              </Button>
            ))}
          </div>
        </div>

        {/* 特殊筛选 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">特殊标识</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.isNew ? "default" : "outline"}
              size="sm"
              onClick={() => handleSpecialFilter('isNew')}
              className="text-xs h-8"
            >
              <span className="mr-1">🆕</span>
              新技师
            </Button>
            <Button
              variant={filters.isRecommended ? "default" : "outline"}
              size="sm"
              onClick={() => handleSpecialFilter('isRecommended')}
              className="text-xs h-8"
            >
              <span className="mr-1">⭐</span>
              推荐技师
            </Button>
          </div>
        </div>

        {/* 搜索功能 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">搜索技师</h4>
          <div className="relative">
            <input
              type="text"
              placeholder={SEARCH_PLACEHOLDER}
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </div>
          </div>
          {filters.search && (
            <p className="text-xs text-gray-500 mt-1">
              搜索: &quot;{filters.search}&quot;
            </p>
          )}
        </div>

        {/* 当前筛选条件显示 */}
        {hasActiveFilters && (
          <div className="pt-2 border-t">
            <div className="flex flex-wrap gap-1">
              <span className="text-xs text-gray-500 mr-2">当前筛选:</span>
              {filters.city && (
                <Badge variant="outline" className="text-xs">
                  {CITIES.find(c => c.key === filters.city)?.name}
                </Badge>
              )}
              {filters.isNew && (
                <Badge variant="new" className="text-xs">
                  新技师
                </Badge>
              )}
              {filters.isRecommended && (
                <Badge variant="recommended" className="text-xs">
                  推荐技师
                </Badge>
              )}
              {filters.search && (
                <Badge variant="secondary" className="text-xs">
                  搜索: {filters.search}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 