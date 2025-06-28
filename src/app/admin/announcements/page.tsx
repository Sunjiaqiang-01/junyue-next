'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  Megaphone,
  Calendar,
  User,
  FileText
} from 'lucide-react'

interface Announcement {
  id: number
  title: string
  content: string
  type: 'normal' | 'urgent'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'normal' as 'normal' | 'urgent',
    isActive: true
  })

  // 获取公告列表
  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/announcements', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const result = await response.json()
        setAnnouncements(result.data || [])
      }
    } catch (error) {
      console.error('获取公告失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingId 
        ? `/api/admin/announcements/${editingId}`
        : '/api/admin/announcements'
      
      const method = editingId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await fetchAnnouncements()
        resetForm()
        alert(editingId ? '公告更新成功！' : '公告创建成功！')
      } else {
        alert('操作失败，请重试')
      }
    } catch (error) {
      console.error('提交公告失败:', error)
      alert('操作失败，请重试')
    }
  }

  // 编辑公告
  const handleEdit = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      isActive: announcement.isActive
    })
    setEditingId(announcement.id)
    setShowForm(true)
  }

  // 删除公告
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条公告吗？')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        await fetchAnnouncements()
        alert('公告删除成功！')
      } else {
        alert('删除失败，请重试')
      }
    } catch (error) {
      console.error('删除公告失败:', error)
      alert('删除失败，请重试')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'normal',
      isActive: true
    })
    setEditingId(null)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题和操作 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">公告管理</h1>
            <p className="text-gray-600 mt-1">管理网站公告信息，支持普通公告和紧急公告</p>
          </div>
          <Button 
            onClick={() => {
              setShowForm(true)
              setEditingId(null)
              setFormData({
                title: '',
                content: '',
                type: 'normal',
                isActive: true
              })
            }}
            className="text-white hover:opacity-90"
            style={{ backgroundColor: '#1A2B5C' }}
          >
            <Plus className="w-4 h-4 mr-2" />
            添加公告
          </Button>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#1A2B5C', color: 'white' }}>
                <Megaphone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">总公告数</p>
                <p className="text-2xl font-bold">{announcements.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">活跃公告</p>
                <p className="text-2xl font-bold">{announcements.filter(a => a.isActive).length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#D4AF37', color: 'white' }}>
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">普通公告</p>
                <p className="text-2xl font-bold">{announcements.filter(a => a.type === 'normal').length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-red-100 text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">紧急公告</p>
                <p className="text-2xl font-bold">{announcements.filter(a => a.type === 'urgent').length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* 公告表单 */}
        {showForm && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {editingId ? '编辑公告' : '添加公告'}
              </h2>
              <Button
                onClick={resetForm}
                variant="outline"
              >
                取消
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  公告标题
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入公告标题"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  公告内容
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                  placeholder="请输入公告内容..."
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  支持换行，内容将按原样显示
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    公告类型
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as 'normal' | 'urgent'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">普通公告</option>
                    <option value="urgent">紧急公告</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    紧急公告将以红色背景显示并有呼吸灯效果
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    发布状态
                  </label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">立即发布</option>
                    <option value="false">保存草稿</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    只有已发布的公告才会在前端显示
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  onClick={resetForm}
                  variant="outline"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  className="text-white hover:opacity-90"
                  style={{ backgroundColor: '#1A2B5C' }}
                >
                  {editingId ? '更新公告' : '创建公告'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* 公告列表 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">公告列表</h2>
          
          {announcements.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Megaphone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>暂无公告</p>
              <p className="text-sm mt-2">点击上方"添加公告"按钮创建第一条公告</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {announcement.title}
                        </h3>
                        
                        <Badge
                          variant={announcement.type === 'urgent' ? 'destructive' : 'secondary'}
                          className={
                            announcement.type === 'urgent' 
                              ? 'bg-red-100 text-red-800' 
                              : 'text-white'
                          }
                          style={
                            announcement.type === 'normal' 
                              ? { backgroundColor: '#D4AF37' } 
                              : {}
                          }
                        >
                          {announcement.type === 'urgent' ? '紧急公告' : '普通公告'}
                        </Badge>
                        
                        <Badge
                          variant={announcement.isActive ? 'default' : 'secondary'}
                          className={
                            announcement.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }
                        >
                          {announcement.isActive ? '已发布' : '草稿'}
                        </Badge>
                      </div>
                      
                      <div className="text-gray-600 mb-3 whitespace-pre-wrap">
                        {announcement.content}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>创建时间: {new Date(announcement.createdAt).toLocaleString('zh-CN')}</span>
                        </div>
                        {announcement.updatedAt !== announcement.createdAt && (
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>更新时间: {new Date(announcement.updatedAt).toLocaleString('zh-CN')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        onClick={() => handleEdit(announcement)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        onClick={() => handleDelete(announcement.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  )
} 