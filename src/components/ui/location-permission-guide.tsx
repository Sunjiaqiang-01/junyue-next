'use client'

import { useState, useEffect } from 'react'
import { Button } from './button'
import { Card } from './card'

interface LocationPermissionGuideProps {
  onLocationGranted?: (location: GeolocationPosition) => void
  onLocationDenied?: (error: GeolocationPositionError) => void
}

export function LocationPermissionGuide({ 
  onLocationGranted, 
  onLocationDenied 
}: LocationPermissionGuideProps) {
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isHttps, setIsHttps] = useState(false)

  useEffect(() => {
    // 检查是否为HTTPS
    setIsHttps(window.location.protocol === 'https:' || window.location.hostname === 'localhost')
    
    // 检查权限状态
    checkPermissionState()
  }, [])

  const checkPermissionState = async () => {
    if (!navigator.permissions) {
      setPermissionState('prompt')
      return
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' })
      setPermissionState(permission.state)
      
      // 监听权限变化
      permission.onchange = () => {
        setPermissionState(permission.state)
      }
    } catch (error) {
      console.warn('无法查询位置权限状态:', error)
      setPermissionState('prompt')
    }
  }

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setError('您的浏览器不支持地理位置功能')
      return
    }

    setIsLoading(true)
    setError(null)

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLoading(false)
        onLocationGranted?.(position)
      },
      (error) => {
        setIsLoading(false)
        
        let errorMessage = '获取位置失败'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '位置访问被拒绝，请在浏览器设置中允许位置访问'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置信息不可用，请检查设备的位置服务是否开启'
            break
          case error.TIMEOUT:
            errorMessage = '获取位置超时，请重试'
            break
        }
        
        setError(errorMessage)
        onLocationDenied?.(error)
      },
      options
    )
  }

  const getPermissionIcon = () => {
    switch (permissionState) {
      case 'granted':
        return '✅'
      case 'denied':
        return '❌'
      case 'prompt':
      default:
        return '❓'
    }
  }

  const getPermissionText = () => {
    switch (permissionState) {
      case 'granted':
        return '位置权限已授予'
      case 'denied':
        return '位置权限被拒绝'
      case 'prompt':
      default:
        return '需要位置权限'
    }
  }

  const getBrowserGuide = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (userAgent.includes('chrome')) {
      return {
        name: 'Chrome浏览器',
        steps: [
          '点击地址栏左侧的锁形图标',
          '选择"站点设置"',
          '将"位置"设置为"允许"',
          '刷新页面'
        ]
      }
    } else if (userAgent.includes('firefox')) {
      return {
        name: 'Firefox浏览器',
        steps: [
          '点击地址栏左侧的盾牌图标',
          '点击"权限"',
          '将"访问您的位置"设置为"允许"',
          '刷新页面'
        ]
      }
    } else if (userAgent.includes('edge')) {
      return {
        name: 'Edge浏览器',
        steps: [
          '点击地址栏左侧的锁形图标',
          '选择"此站点的权限"',
          '将"位置"设置为"允许"',
          '刷新页面'
        ]
      }
    } else {
      return {
        name: '浏览器',
        steps: [
          '点击地址栏附近的权限图标',
          '找到位置权限设置',
          '允许位置访问',
          '刷新页面'
        ]
      }
    }
  }

  const browserGuide = getBrowserGuide()

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">📍 位置权限设置</h3>
          <div className="flex items-center justify-center space-x-2 text-sm">
            <span>{getPermissionIcon()}</span>
            <span>{getPermissionText()}</span>
          </div>
        </div>

        {!isHttps && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <span className="text-yellow-600">⚠️</span>
              <div className="text-sm text-yellow-800">
                <p className="font-medium">安全提示</p>
                <p>现代浏览器要求在HTTPS环境下才能使用地理位置功能。</p>
                <p className="mt-1 text-xs">localhost除外，但部署后需要HTTPS证书。</p>
              </div>
            </div>
          </div>
        )}

        {permissionState === 'denied' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-sm text-red-800">
              <p className="font-medium mb-2">如何重新允许位置访问：</p>
              <div className="space-y-1">
                <p className="font-medium">{browserGuide.name}设置步骤：</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  {browserGuide.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <span className="text-red-600">❌</span>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Button 
            onClick={requestLocation} 
            disabled={isLoading || permissionState === 'denied'}
            className="w-full"
          >
            {isLoading ? '正在获取位置...' : '获取我的位置'}
          </Button>
          
          {permissionState === 'denied' && (
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="w-full"
            >
              刷新页面重试
            </Button>
          )}
        </div>

        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>常见问题解决：</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>确保设备的位置服务已开启</li>
            <li>检查浏览器是否有位置访问权限</li>
            <li>尝试刷新页面重新请求权限</li>
            <li>如果在手机上，确保浏览器有位置权限</li>
          </ul>
        </div>
      </div>
    </Card>
  )
} 