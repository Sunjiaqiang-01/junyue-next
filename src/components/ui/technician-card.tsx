'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { MapPin, ExternalLink, Navigation, RefreshCw } from 'lucide-react'
import { MediaCarousel } from './media-carousel'
import { Badge } from './badge'
import { Button } from './button'
import { useDialog, DialogContainer } from './dialog'
import { Technician, TechnicianMedia } from '@/lib/data/types'
import { useLocation } from '@/hooks/useLocation'
import { useDistance } from '@/hooks/useDistance'

interface TechnicianCardProps {
  technician: Technician
  className?: string
  userLocation?: any // 从父组件传入的用户位置
}

export function TechnicianCard({ technician, className = '', userLocation }: TechnicianCardProps) {
  const { dialogs, showWarning, showInfo, removeDialog } = useDialog()
  
  // 使用位置和距离hooks
  const { location: deviceLocation, getCurrentLocation, loading: locationLoading } = useLocation({ 
    autoFetch: false, 
    enableCache: true 
  })
  
  const currentUserLocation = userLocation || deviceLocation
  
  const { 
    getDistance, 
    calculateDistanceToTechnician, 
    getFormattedDistance,
    loading: distanceLoading 
  } = useDistance({ userLocation: currentUserLocation })

  const {
    nickname,
    age,
    height,
    weight,
    features,
    address,
    latitude,
    longitude,
    area,
    media,
    isNew,
    isRecommended
  } = technician

  // 计算距离
  useEffect(() => {
    if (currentUserLocation && latitude && longitude) {
      calculateDistanceToTechnician(technician).catch(error => {
        console.warn(`计算到技师 ${nickname} 的距离失败:`, error)
      })
    }
  }, [currentUserLocation, technician, calculateDistanceToTechnician, nickname, latitude, longitude])

  // 处理地图导航
  const handleMapNavigation = (type: 'baidu' | 'gaode') => {
    if (!latitude || !longitude) {
      showWarning('位置信息', '暂无位置信息')
      return
    }

    try {
      const lat = parseFloat(latitude.toString())
      const lng = parseFloat(longitude.toString())
      
      // 检查经纬度值是否有效
      if (isNaN(lat) || isNaN(lng)) {
        showWarning('位置信息', '位置坐标无效')
        return
      }

      // 检测是否为移动设备
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      // 检测iOS设备
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)

      // 显示加载提示
      showInfo('地图导航', `正在尝试打开${type === 'baidu' ? '百度' : '高德'}地图...`)

      // 处理APP跳转失败的情况
      let appOpenTimeout: number | null = null

      if (type === 'baidu') {
        // 百度地图跳转
        if (isMobile) {
          // 构建百度地图URL
          let baiduAppUrl = ''
          if (isIOS) {
            // iOS百度地图
            baiduAppUrl = `baidumap://map/direction?destination=latlng:${lat},${lng}|name:${encodeURIComponent(nickname)}&coord_type=bd09ll&src=webapp.junyue.spa`
          } else {
            // Android百度地图
            baiduAppUrl = `bdapp://map/direction?destination=latlng:${lat},${lng}|name:${encodeURIComponent(nickname)}&coord_type=bd09ll&src=webapp.junyue.spa`
          }

          // 尝试打开APP
          window.location.href = baiduAppUrl
          
          // 添加延时检查，如果无法打开百度APP，则使用网页版
          appOpenTimeout = window.setTimeout(() => {
            const baiduWebUrl = `https://api.map.baidu.com/marker?location=${lat},${lng}&title=${encodeURIComponent(nickname)}&content=${encodeURIComponent(address)}&output=html&src=webapp.junyue.spa`
            window.location.href = baiduWebUrl
          }, 2500)
        } else {
          // PC设备使用百度地图网页版
          const baiduUrl = `https://api.map.baidu.com/marker?location=${lat},${lng}&title=${encodeURIComponent(nickname)}&content=${encodeURIComponent(address)}&output=html&src=webapp.junyue.spa`
          window.open(baiduUrl, '_blank')
        }
      } else {
        // 高德地图跳转
        
        // 注意：需要进行坐标系转换 - 百度坐标系(BD09)转为高德坐标系(GCJ02)
        // 转换坐标 - 使用更精确的转换算法
        const { gcjLng, gcjLat } = bd09ToGcj02Accurate(lng, lat)
        
        if (isMobile) {
          // 构建高德地图URL
          let gaodeAppUrl = ''
          if (isIOS) {
            // iOS高德地图 - 使用导航功能而非仅查看位置
            gaodeAppUrl = `iosamap://path?sourceApplication=junyue&dlat=${gcjLat}&dlon=${gcjLng}&dname=${encodeURIComponent(nickname)}&dev=0`
          } else {
            // Android高德地图 - 使用导航功能而非仅查看位置
            gaodeAppUrl = `androidamap://path?sourceApplication=junyue&dlat=${gcjLat}&dlon=${gcjLng}&dname=${encodeURIComponent(nickname)}&dev=0`
          }

          // 尝试打开APP
          window.location.href = gaodeAppUrl
          
          // 添加延时检查，如果无法打开高德APP，则使用网页版
          appOpenTimeout = window.setTimeout(() => {
            // 使用导航功能而非标记，提供更好的用户体验
            const gaodeWebUrl = `https://uri.amap.com/navigation?to=${gcjLng},${gcjLat},${encodeURIComponent(nickname)}&toName=${encodeURIComponent(address)}&src=junyue&callnative=1`
            window.location.href = gaodeWebUrl
          }, 2500)
        } else {
          // PC设备使用高德地图网页版
          const gaodeWebUrl = `https://uri.amap.com/marker?position=${gcjLng},${gcjLat}&name=${encodeURIComponent(nickname)}&address=${encodeURIComponent(address)}&src=junyue`
          window.open(gaodeWebUrl, '_blank')
        }
      }

      // 如果页面即将卸载，清除定时器
      window.addEventListener('beforeunload', () => {
        if (appOpenTimeout) {
          clearTimeout(appOpenTimeout)
        }
      }, { once: true })
      
    } catch (error) {
      console.error('地图导航出错:', error)
      showWarning('地图导航', '打开地图出错，请稍后再试')
    }
  }
  
  /**
   * 百度坐标系(BD09)转为高德坐标系(GCJ02) - 更精确版本
   * @param lng 百度坐标经度
   * @param lat 百度坐标纬度
   * @returns 高德坐标对象，包含经度和纬度
   */
  function bd09ToGcj02Accurate(lng: number, lat: number): { gcjLng: number; gcjLat: number } {
    // BD09转GCJ02的转换参数
    const xPi = 3.14159265358979324 * 3000.0 / 180.0;
    
    // 百度坐标系转火星坐标系
    const x = lng - 0.0065;
    const y = lat - 0.006;
    const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * xPi);
    const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * xPi);
    
    const gcjLng = z * Math.cos(theta);
    const gcjLat = z * Math.sin(theta);
    
    return { gcjLng, gcjLat };
  }

  // 处理预约
  const handleBooking = () => {
    showInfo('预约服务', `联系客服预约 ${nickname}`)
  }

  // 获取位置权限并计算距离
  const handleGetLocation = async () => {
    try {
      await getCurrentLocation()
      showInfo('位置获取', '位置获取成功，正在计算距离...')
    } catch (error) {
      showWarning('位置获取失败', '请允许位置访问权限或检查网络连接')
    }
  }

  // 获取显示的距离
  const getDisplayDistance = () => {
    const distance = getDistance(technician.id)
    
    if (distanceLoading) {
      return '计算中...'
    }
    
    if (distance !== null) {
      return getFormattedDistance(distance)
    }
    
    if (!currentUserLocation) {
      return '点击获取'
    }
    
    return '计算中...'
  }

  return (
    <>
      <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 ${className}`}>
        {/* 媒体轮播 */}
        <div className="relative">
          <MediaCarousel
            media={media}
            aspectRatio="aspect-[3/4]"
            showThumbnails={false}
          />
          
          {/* 标识徽章 */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
            {isRecommended && (
              <Badge variant="recommended" className="text-xs shadow-lg">
                ⭐ 推荐技师
              </Badge>
            )}
            {isNew && (
              <Badge variant="new" className="text-xs shadow-lg">
                🆕 新技师
              </Badge>
            )}
          </div>

          {/* 距离显示已禁用 */}
        </div>

        {/* 技师信息 */}
        <div className="p-4">
          {/* 基本信息 */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{nickname}</h3>
              <div className="flex space-x-2 text-sm text-gray-600">
                <span className="bg-gray-100 px-2 py-1 rounded">{age}岁</span>
                <span className="bg-gray-100 px-2 py-1 rounded">{height}cm</span>
                <span className="bg-gray-100 px-2 py-1 rounded">{weight}kg</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 line-clamp-2">
              {features}
            </p>
          </div>

          {/* 位置信息 */}
          <div className="mb-4">
            <div className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 font-medium">
                  {address}
                </p>
                {area && (
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {area}
                  </p>
                )}
              </div>
            </div>
            
            {/* 地图按钮 */}
            <div className="flex space-x-2 mt-2">
              <button
                onClick={() => handleMapNavigation('baidu')}
                className="flex-1 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
              >
                <span>🧭</span>
                百度地图
              </button>
              <button
                onClick={() => handleMapNavigation('gaode')}
                className="flex-1 px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
              >
                <span>🧭</span>
                高德地图
              </button>
            </div>
          </div>


        </div>
      </div>

      {/* Dialog容器 */}
      <DialogContainer dialogs={dialogs} onClose={removeDialog} />
    </>
  )
} 