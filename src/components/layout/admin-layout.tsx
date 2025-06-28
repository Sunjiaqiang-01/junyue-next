'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Megaphone, 
  Users, 
  MessageSquare, 
  FolderOpen, 
  Monitor, 
  Settings,
  LogOut,
  Menu,
  X,
  Clock
} from 'lucide-react'

// 时间组件，避免Hydration错误
function CurrentTime() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleString('zh-CN'))
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    
    return () => clearInterval(interval)
  }, [])

  return <span>{time}</span>
}

interface AdminLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { href: '/admin/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { href: '/admin/announcements', label: '公告管理', icon: Megaphone },
  { href: '/admin/technicians', label: '技师管理', icon: Users },
  { href: '/admin/customer-service', label: '客服管理', icon: MessageSquare },
  { href: '/admin/media', label: '媒体管理', icon: FolderOpen },
  { href: '/admin/system', label: '系统监控', icon: Monitor },
  { href: '/admin/settings', label: '系统设置', icon: Settings },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const [currentTime, setCurrentTime] = useState('')

  // 检查登录状态
  useEffect(() => {
    // 这里可以添加检查登录状态的逻辑
    // 如果未登录，重定向到登录页面
  }, [])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }))
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/login', {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/admin/login')
      } else {
        console.error('Logout failed')
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full" style={{ backgroundColor: '#1A2B5C' }}>
          {/* Logo区域 */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-blue-700">
            <div className="flex items-center space-x-3">
              <Image
                src="/assets/logo.png"
                alt="君悦彩虹SPA Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-white font-semibold text-lg">君悦彩虹SPA</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:bg-blue-700 p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group
                    ${isActive 
                      ? 'bg-yellow-500 text-gray-900 shadow-lg' 
                      : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                    }
                  `}
                  style={isActive ? { backgroundColor: '#D4AF37' } : {}}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-gray-900' : 'text-blue-200 group-hover:text-white'}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* 用户信息区域 */}
          <div className="px-4 py-4 border-t border-blue-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                   style={{ backgroundColor: '#D4AF37' }}>
                管
              </div>
              <div>
                <p className="text-white font-medium">管理员</p>
                <p className="text-blue-200 text-sm flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {currentTime}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-blue-100 hover:bg-blue-700 rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">管理后台</h1>
            <div className="w-10"></div>
          </div>
        </header>

        {/* 主内容 */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 