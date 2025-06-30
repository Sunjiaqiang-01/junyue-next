'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale
} from 'chart.js'
import { Line, Pie } from 'react-chartjs-2'
import { Progress } from '@/components/ui/progress'

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale
)

interface SystemStats {
  totalTechnicians: number
  activeTechnicians: number
  totalAnnouncements: number
  activeAnnouncements: number
  systemStatus: string
  lastUpdate: string
  cpu: {
    usage: number
    cores: number
    loadAvg: number
  }
  memory: {
    usage: number
    used: number
    total: number
    free: number
  }
  disk: {
    usage: number
    used: number
    total: number
    free: number
  }
  system: {
    uptime: number
    hostname: string
    platform: string
  }
  technicianRanking: Array<{id: string, name: string, views: number}>
  recentActivities: Array<{type: string, message: string, time: string, icon: string}>
  cityDistribution?: Record<string, number>
}

type PeriodType = 'day' | 'week' | 'month';

const CITY_NAME_MAP: Record<string, string> = {
  nanjing: '南京',
  suzhou: '苏州',
  hangzhou: '杭州',
  wuhan: '武汉',
  zhengzhou: '郑州'
}

const CITY_COLORS = {
  nanjing: '#D4AF37', // 南京金
  suzhou: 'rgba(75, 192, 192, 0.6)', // 苏州绿
  hangzhou: 'rgba(54, 162, 235, 0.6)', // 杭州蓝
  wuhan: 'rgba(255, 99, 132, 0.6)', // 武汉粉
  zhengzhou: 'rgba(255, 159, 64, 0.6)' // 郑州橙
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats>({
    totalTechnicians: 0,
    activeTechnicians: 0,
    totalAnnouncements: 0,
    activeAnnouncements: 0,
    systemStatus: '运行中',
    lastUpdate: new Date().toLocaleString('zh-CN'),
    cpu: { usage: 0, cores: 0, loadAvg: 0 },
    memory: { usage: 0, used: 0, total: 0, free: 0 },
    disk: { usage: 0, used: 0, total: 0, free: 0 },
    system: { uptime: 0, hostname: '', platform: '' },
    technicianRanking: [],
    recentActivities: [],
    cityDistribution: {}
  })
  const [loading, setLoading] = useState(false)
  const [cpuHistoryData, setCpuHistoryData] = useState<number[]>([])
  const [memoryHistoryData, setMemoryHistoryData] = useState<number[]>([])
  const [timeLabels, setTimeLabels] = useState<string[]>([])
  const [viewsPeriod, setViewsPeriod] = useState<PeriodType>('day')

  // 刷新数据
  const refreshData = async () => {
    setLoading(true)
    try {
      // 使用健康检查API获取系统数据（不需要验证）
      const response = await fetch(`/api/health?dashboard=true&period=${viewsPeriod}`)
      
      if (response.ok) {
        const dashboardData = await response.json()
        const data = dashboardData.dashboard
        
        // 更新状态
        setStats({
          totalTechnicians: data.technicians.total,
          activeTechnicians: data.technicians.active,
          totalAnnouncements: data.announcements.total,
          activeAnnouncements: data.announcements.active,
          systemStatus: data.status === 'normal' ? '正常' : data.status === 'warning' ? '警告' : '严重',
          lastUpdate: new Date().toLocaleString('zh-CN'),
          cpu: data.cpu,
          memory: data.memory,
          disk: data.disk,
          system: data.system,
          technicianRanking: data.technicianRanking || [],
          recentActivities: [
            ...(data.announcements.recentActivities || []),
            { type: 'system', message: '系统自动备份完成', time: '1小时前', icon: '⚙️' },
            { type: 'login', message: '管理员登录成功', time: '2小时前', icon: '🔐' }
          ],
          cityDistribution: data.technicians.cityDistribution || {}
        })
        
        // 更新历史图表数据
        const currentTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        
        setCpuHistoryData(prev => {
          const newData = [...prev, data.cpu.usage]
          if (newData.length > 10) return newData.slice(-10)
          return newData
        })
        
        setMemoryHistoryData(prev => {
          const newData = [...prev, data.memory.usage]
          if (newData.length > 10) return newData.slice(-10)
          return newData
        })
        
        setTimeLabels(prev => {
          const newLabels = [...prev, currentTime]
          if (newLabels.length > 10) return newLabels.slice(-10)
          return newLabels
        })
      }
    } catch (error) {
      console.error('Failed to refresh data:', error)
    } finally {
      setLoading(false)
    }
  }

  // 当时间段变化时刷新数据
  useEffect(() => {
    refreshData();
  }, [viewsPeriod]);

  // 自动刷新数据
  useEffect(() => {
    refreshData() // 初始加载
    
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
      value: stats.systemStatus,
      subtitle: `运行时间: ${stats.system.uptime}小时`,
      icon: '⚙️',
      color: stats.systemStatus === '正常' ? 'bg-purple-500' : stats.systemStatus === '警告' ? 'bg-yellow-500' : 'bg-red-500'
    },
    {
      title: '最后更新',
      value: '实时',
      subtitle: stats.lastUpdate,
      icon: '🕐',
      color: 'bg-orange-500'
    }
  ]

  // CPU使用率图表配置
  const cpuChartData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'CPU使用率 %',
        data: cpuHistoryData,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  }

  // 内存使用率图表配置
  const memoryChartData = {
    labels: timeLabels,
    datasets: [
      {
        label: '内存使用率 %',
        data: memoryHistoryData,
        fill: false,
        borderColor: 'rgb(153, 102, 255)',
        tension: 0.1
      }
    ]
  }

  // 技师分布图表数据
  const technicianDistributionData = {
    labels: Object.entries(stats.cityDistribution || {}).map(([code, _]) => CITY_NAME_MAP[code] || code),
    datasets: [
      {
        label: '技师分布',
        data: Object.values(stats.cityDistribution || {}),
        backgroundColor: Object.entries(stats.cityDistribution || {}).map(([code, _]) => 
          CITY_COLORS[code as keyof typeof CITY_COLORS] || 'rgba(153, 102, 255, 0.6)'
        ),
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        display: true,
        labels: {
          boxWidth: 12,
          font: {
            size: 10
          }
        }
      },
      tooltip: {
        enabled: true
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          font: {
            size: 10
          }
        }
      },
      x: {
        ticks: {
          font: {
            size: 10
          }
        }
      }
    }
  }

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        display: true,
        labels: {
          boxWidth: 12,
          font: {
            size: 10
          }
        }
      }
    }
  }

  const handlePeriodChange = (period: PeriodType) => {
    setViewsPeriod(period);
  };

  // 获取时间段对应的中文名称
  const getPeriodName = (period: PeriodType) => {
    switch (period) {
      case 'day': return '今日';
      case 'week': return '本周';
      case 'month': return '本月';
      default: return '今日';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
            <p className="text-sm text-gray-600 mt-0.5">系统概览和关键指标</p>
          </div>
          <Button 
            onClick={refreshData}
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
            size="sm"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                刷新中...
              </div>
            ) : (
              '刷新数据'
            )}
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-3">
          {statCards.map((card, index) => (
            <Card key={index} className="p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${card.color} text-white mr-3`}>
                  <span className="text-xl">{card.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-medium text-gray-600">{card.title}</h3>
                  <p className="text-xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-xs text-gray-500">{card.subtitle}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* 系统资源监控 */}
          <Card className="p-3">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">系统资源监控</h2>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs text-gray-600">CPU使用率</span>
                  <span className="text-xs font-medium text-gray-900">{stats.cpu.usage}%</span>
            </div>
                <Progress value={stats.cpu.usage} className="h-1.5" 
                  style={{
                    backgroundColor: '#e5e7eb', 
                    '--progress-value': `${stats.cpu.usage}%`,
                    '--progress-color': stats.cpu.usage > 80 ? '#ef4444' : stats.cpu.usage > 60 ? '#f59e0b' : '#10b981'
                  } as any} 
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs text-gray-600">内存使用率</span>
                  <span className="text-xs font-medium text-gray-900">{stats.memory.usage}%</span>
                </div>
                <Progress value={stats.memory.usage} className="h-1.5" 
                  style={{
                    backgroundColor: '#e5e7eb', 
                    '--progress-value': `${stats.memory.usage}%`,
                    '--progress-color': stats.memory.usage > 80 ? '#ef4444' : stats.memory.usage > 60 ? '#f59e0b' : '#10b981'
                  } as any} 
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs text-gray-600">磁盘使用率</span>
                  <span className="text-xs font-medium text-gray-900">{stats.disk.usage}%</span>
                </div>
                <Progress value={stats.disk.usage} className="h-1.5" 
                  style={{
                    backgroundColor: '#e5e7eb', 
                    '--progress-value': `${stats.disk.usage}%`,
                    '--progress-color': stats.disk.usage > 80 ? '#ef4444' : stats.disk.usage > 60 ? '#f59e0b' : '#10b981'
                  } as any} 
                />
              </div>
              <div className="pt-1 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-600">服务器</p>
                    <p className="text-xs font-medium text-gray-900">{stats.system.hostname || '未知'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">平台</p>
                    <p className="text-xs font-medium text-gray-900 truncate">{stats.system.platform || '未知'}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-600">CPU核心</p>
                  <p className="text-xs font-medium text-gray-900">{stats.cpu.cores || '未知'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">内存总量</p>
                  <p className="text-xs font-medium text-gray-900">{stats.memory.total || 0} GB</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">磁盘总量</p>
                  <p className="text-xs font-medium text-gray-900">{stats.disk.total || 0} GB</p>
                </div>
              </div>
            </div>
          </Card>
          
          {/* CPU使用率图表 */}
          <Card className="p-3">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">CPU使用率</h2>
            <div className="h-44">
              {cpuHistoryData.length > 0 ? (
                <Line data={cpuChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-xs">加载中...</p>
                </div>
              )}
            </div>
          </Card>

          {/* 内存使用率图表 */}
          <Card className="p-3">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">内存使用率</h2>
            <div className="h-44">
              {memoryHistoryData.length > 0 ? (
                <Line data={memoryChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-xs">加载中...</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* 技师访问排行榜 */}
          <Card className="p-3">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold text-gray-900">技师访问排行榜</h2>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => handlePeriodChange('day')} 
                  className={`px-2 py-0.5 text-xs rounded ${viewsPeriod === 'day' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  今日
                </button>
                <button 
                  onClick={() => handlePeriodChange('week')} 
                  className={`px-2 py-0.5 text-xs rounded ${viewsPeriod === 'week' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  本周
                </button>
                <button 
                  onClick={() => handlePeriodChange('month')} 
                  className={`px-2 py-0.5 text-xs rounded ${viewsPeriod === 'month' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  本月
                </button>
              </div>
            </div>
            <div className="space-y-2.5">
              {stats.technicianRanking?.length > 0 ? (
                stats.technicianRanking.map((tech, index) => (
                  <div key={tech.id} className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                      <span className="font-semibold text-blue-700 text-xs">{index + 1}</span>
              </div>
              <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-medium text-gray-900">{tech.name}</p>
                        <p className="text-xs text-gray-600">{tech.views} 访问</p>
                      </div>
                      <Progress value={(tech.views / (stats.technicianRanking?.[0]?.views || 1)) * 100} className="h-1 mt-0.5" 
                        style={{
                          backgroundColor: '#e5e7eb', 
                          '--progress-value': `${(tech.views / (stats.technicianRanking?.[0]?.views || 1)) * 100}%`,
                          '--progress-color': index === 0 ? '#f59e0b' : index === 1 ? '#6366f1' : '#10b981'
                        } as any} 
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-500">{getPeriodName(viewsPeriod)}暂无访问数据</p>
                </div>
              )}
            </div>
          </Card>

          {/* 技师城市分布 */}
          <Card className="p-3">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">技师城市分布</h2>
            <div className="h-44 flex justify-center items-center">
              {technicianDistributionData.datasets?.[0]?.data?.length > 0 ? (
                <Pie data={technicianDistributionData} options={pieChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-xs">暂无数据</p>
              </div>
              )}
            </div>
          </Card>

          {/* 最近活动 */}
          <Card className="p-3">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">最近活动</h2>
            <div className="space-y-2">
              {stats.recentActivities?.map((activity, index) => (
                <div key={index} className="flex items-center py-1.5 border-b border-gray-100 last:border-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                    activity.type === 'technician' ? 'bg-blue-100' : 
                    activity.type === 'announcement' ? 'bg-green-100' : 
                    activity.type === 'system' ? 'bg-purple-100' :
                    activity.type === 'login' ? 'bg-indigo-100' :
                    'bg-yellow-100'
                  }`}>
                    <span className={`text-xs ${
                      activity.type === 'technician' ? 'text-blue-600' : 
                      activity.type === 'announcement' ? 'text-green-600' : 
                      activity.type === 'system' ? 'text-purple-600' :
                      activity.type === 'login' ? 'text-indigo-600' :
                      'text-yellow-600'
                    }`}>{activity.icon}</span>
              </div>
              <div className="flex-1">
                    <p className="text-xs text-gray-900 line-clamp-1">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
              </div>
              ))}
            </div>
          </Card>
          </div>
      </div>
    </AdminLayout>
  )
} 