'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SystemStats {
  totalTechnicians: number
  activeTechnicians: number
  totalAnnouncements: number
  activeAnnouncements: number
  systemUptime: string
  lastUpdate: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats>({
    totalTechnicians: 3,
    activeTechnicians: 3,
    totalAnnouncements: 3,
    activeAnnouncements: 3,
    systemUptime: '运行中',
    lastUpdate: new Date().toLocaleString('zh-CN')
  })
  const [loading, setLoading] = useState(false)

  // 刷新数据
  const refreshData = async () => {
    setLoading(true)
    try {
      // 这里可以调用API获取实际数据
      // const response = await fetch('/api/admin/stats')
      // const data = await response.json()
      
      // 模拟数据更新
      setStats(prev => ({
        ...prev,
        lastUpdate: new Date().toLocaleString('zh-CN')
      }))
    } catch (error) {
      console.error('Failed to refresh data:', error)
    } finally {
      setLoading(false)
    }
  }

  // 自动刷新数据
  useEffect(() => {
    const interval = setInterval(refreshData, 30000) // 每30秒刷新一次
    return () => clearInterval(interval)
  }, [])

  const statCards = [
    {
      title: '技师总数',
      value: stats.totalTechnicians,
      subtitle: `活跃: ${stats.activeTechnicians}`,
      icon: '👥',
      color: 'bg-blue-500'
    },
    {
      title: '公告总数',
      value: stats.totalAnnouncements,
      subtitle: `活跃: ${stats.activeAnnouncements}`,
      icon: '📢',
      color: 'bg-green-500'
    },
    {
      title: '系统状态',
      value: '正常',
      subtitle: stats.systemUptime,
      icon: '⚙️',
      color: 'bg-purple-500'
    },
    {
      title: '最后更新',
      value: '实时',
      subtitle: stats.lastUpdate,
      icon: '🕐',
      color: 'bg-orange-500'
    }
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
            <p className="text-gray-600 mt-1">系统概览和关键指标</p>
          </div>
          <Button 
            onClick={refreshData}
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                刷新中...
              </div>
            ) : (
              '刷新数据'
            )}
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => (
            <Card key={index} className="p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${card.color} text-white mr-4`}>
                  <span className="text-2xl">{card.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* 快速操作区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 快速操作 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h2>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/admin/technicians'}
              >
                <span className="mr-2">👥</span>
                管理技师信息
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/admin/announcements'}
              >
                <span className="mr-2">📢</span>
                发布新公告
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/admin/customer-service'}
              >
                <span className="mr-2">💬</span>
                更新客服信息
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/admin/system'}
              >
                <span className="mr-2">⚙️</span>
                系统监控
              </Button>
            </div>
          </Card>

          {/* 系统信息 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">系统信息</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">服务器状态</span>
                <span className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  运行正常
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">数据库连接</span>
                <span className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  连接正常
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">存储空间</span>
                <span className="text-gray-900">充足</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">版本信息</span>
                <span className="text-gray-900">v1.0.0</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">最后备份</span>
                <span className="text-gray-900">今日 02:00</span>
              </div>
            </div>
          </Card>
        </div>

        {/* 最近活动 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">最近活动</h2>
          <div className="space-y-3">
            <div className="flex items-center py-3 border-b border-gray-100">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 text-sm">👥</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">技师信息已更新</p>
                <p className="text-xs text-gray-500">2分钟前</p>
              </div>
            </div>
            <div className="flex items-center py-3 border-b border-gray-100">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 text-sm">📢</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">新公告已发布</p>
                <p className="text-xs text-gray-500">5分钟前</p>
              </div>
            </div>
            <div className="flex items-center py-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-purple-600 text-sm">⚙️</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">系统自动备份完成</p>
                <p className="text-xs text-gray-500">1小时前</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
} 