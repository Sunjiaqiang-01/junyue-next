'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TechnicianForm } from '@/components/custom/technician-form'
import { useToast, ToastContainer } from '@/components/ui/toast'
import Image from 'next/image'
import { 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Eye,
  EyeOff,
  MapPin,
  Camera,
  Video
} from 'lucide-react'

import { Technician, TechnicianMedia } from '@/lib/data/types'

export default function AdminTechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)
  const [formMode, setFormMode] = useState<'list' | 'add' | 'edit'>('list')
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { toasts, success, error, warning } = useToast()

  // 获取技师列表
  const fetchTechnicians = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/technicians', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setTechnicians(data.data || [])
      } else {
        console.error('Failed to fetch technicians:', response.status)
        setTechnicians([])
      }
    } catch (error) {
      console.error('Failed to fetch technicians:', error)
      setTechnicians([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTechnicians()
  }, [])

  // 处理表单提交
  const handleFormSubmit = async (formData: any) => {
    setSubmitting(true)
    try {
      const url = formMode === 'edit' 
        ? `/api/admin/technicians/${editingTechnician?.id}`
        : '/api/admin/technicians'
      
      const method = formMode === 'edit' ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          nickname: formData.nickname,
          age: formData.age,
          height: formData.height,
          weight: formData.weight,
          features: formData.features,
          isNew: formData.isNew,
          isRecommended: formData.isRecommended,
          isActive: formData.isActive,
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude,
          area: formData.area,
          cities: formData.cities,
          media: formData.media
        }),
      })

      if (response.ok) {
        await fetchTechnicians()
        setFormMode('list')
        setEditingTechnician(null)
        success(formMode === 'edit' ? '技师信息更新成功！' : '技师添加成功！')
      } else {
        const errorData = await response.json()
        error(`操作失败: ${errorData.error || '未知错误'}`)
      }
    } catch (error) {
      console.error('Form submission error:', error)
      alert('操作失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  // 取消表单
  const handleFormCancel = () => {
    setFormMode('list')
    setEditingTechnician(null)
  }

  // 开始编辑
  const handleEdit = (technician: Technician) => {
    setEditingTechnician(technician)
    setFormMode('edit')
  }

  // 切换技师状态
  const toggleTechnicianStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/technicians/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        fetchTechnicians()
        alert(`技师已${!isActive ? '上线' : '下线'}`)
      }
    } catch (error) {
      console.error('Failed to toggle technician status:', error)
      alert('操作失败，请重试')
    }
  }

  // 删除技师
  const deleteTechnician = async (id: string) => {
    if (!confirm('确定要删除这位技师吗？此操作不可恢复！')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/technicians/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        await fetchTechnicians()
        alert('技师删除成功！')
      } else {
        alert('删除失败，请重试')
      }
    } catch (error) {
      console.error('Failed to delete technician:', error)
      alert('删除失败，请重试')
    }
  }

  // 同步媒体文件
  const syncMediaFiles = async () => {
    if (!confirm('确定要同步媒体文件吗？这将扫描技师文件夹并更新媒体数据。')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/technicians/sync-media', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        await fetchTechnicians(); // 重新获取技师数据
        success(`同步成功！更新了 ${result.data.updatedTechnicians} 位技师的媒体数据`);
      } else {
        const errorData = await response.json();
        error(`同步失败: ${errorData.error || '未知错误'}`);
      }
    } catch (err) {
      console.error('Sync media error:', err);
      error('同步失败，请重试');
    }
  };

  // 转换数据格式用于表单
  const convertTechnicianForForm = (technician: Technician) => {
    return {
      id: technician.id, // 添加ID字段
      nickname: technician.nickname,
      age: technician.age,
      height: technician.height,
      weight: technician.weight,
      cities: technician.cities,
      features: technician.features,
      isNew: technician.isNew,
      isActive: technician.isActive,
      isRecommended: technician.isRecommended,
      address: technician.address,
      latitude: technician.latitude,
      longitude: technician.longitude,
      area: technician.area,
      media: technician.media.map((m, index) => ({
        type: m.type,
        path: m.path, // 使用path字段
        thumbnail: m.thumbnail,
        description: m.description || '',
        sortOrder: index + 1
      }))
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 表单模式 */}
        {formMode !== 'list' && (
          <div className="space-y-4">
            {/* 返回按钮 */}
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handleFormCancel}
                disabled={submitting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回列表
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {formMode === 'add' ? '添加技师' : '编辑技师'}
                </h1>
                <p className="text-gray-600">
                  {formMode === 'add' ? '填写技师基本信息' : `编辑 ${editingTechnician?.nickname} 的信息`}
                </p>
              </div>
            </div>

            {/* 技师表单 */}
            <TechnicianForm
              initialData={formMode === 'edit' && editingTechnician ? convertTechnicianForForm(editingTechnician) : undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              loading={submitting}
            />
          </div>
        )}

        {/* 列表模式 */}
        {formMode === 'list' && (
          <>
            {/* 页面标题 */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">技师管理</h1>
                <p className="text-gray-600">管理平台技师信息</p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline"
                  onClick={syncMediaFiles}
                  className="text-purple-600 border-purple-600 hover:bg-purple-50"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  同步媒体文件
                </Button>
                <Button 
                  onClick={() => setFormMode('add')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  添加技师
                </Button>
              </div>
            </div>

            {/* 统计信息 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">👥</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">总技师数</p>
                    <p className="text-xl font-bold">{technicians.length}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">在线技师</p>
                    <p className="text-xl font-bold text-green-600">
                      {technicians.filter(t => t.isActive).length}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 font-semibold">🆕</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">新技师</p>
                    <p className="text-xl font-bold text-yellow-600">
                      {technicians.filter(t => t.isNew).length}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-semibold">⭐</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">推荐技师</p>
                    <p className="text-xl font-bold text-purple-600">
                      {technicians.filter(t => t.isRecommended).length}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* 技师列表 */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">技师列表</h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-500">加载中...</p>
                </div>
              ) : !technicians || technicians.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">暂无技师</p>
                  <Button onClick={() => setFormMode('add')}>
                    <Plus className="w-4 h-4 mr-2" />
                    添加第一位技师
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {technicians.map((technician) => (
                    <div key={technician.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-4">
                        {/* 技师头像 */}
                        <div className="flex-shrink-0">
                          {technician.media && technician.media.length > 0 ? (
                            <div className="relative">
                              <Image
                                src={technician.media[0].thumbnail}
                                alt={`${technician.nickname}头像`}
                                width={80}
                                height={80}
                                className="rounded-lg object-cover"
                              />
                              {technician.media.length > 1 && (
                                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs px-1 py-0.5 rounded">
                                  +{technician.media.length - 1}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-gray-400 text-xs">无图片</span>
                            </div>
                          )}
                        </div>

                        {/* 技师信息 */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold">{technician.nickname}</h3>
                            {technician.isNew && (
                              <Badge className="bg-yellow-500 text-white">新人</Badge>
                            )}
                            {technician.isRecommended && (
                              <Badge className="bg-purple-500 text-white">推荐</Badge>
                            )}
                            <Badge 
                              variant={technician.isActive ? 'default' : 'destructive'}
                            >
                              {technician.isActive ? '已上线' : '已下线'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                            <div>年龄: {technician.age}岁</div>
                            <div>身高: {technician.height}cm</div>
                            <div>体重: {technician.weight}kg</div>
                            <div>城市: {technician.cities?.[0] || '未设置'}</div>
                          </div>
                          
                          <p className="text-gray-700 mb-2 line-clamp-2">{technician.features}</p>
                          
                          <div className="flex items-start text-sm text-gray-500 mb-1">
                            <MapPin className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              {/* 第一行：地点名称 */}
                              <div className="font-medium text-gray-700 leading-tight">
                                {technician.address}
                              </div>
                              {/* 第二行：详细地址 */}
                              {technician.area && (
                                <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                  {technician.area}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span>创建: {new Date(technician.createdAt).toLocaleDateString('zh-CN')}</span>
                            <span>更新: {new Date(technician.updatedAt).toLocaleDateString('zh-CN')}</span>
                            {technician.media.length > 0 && (
                              <div className="flex items-center space-x-1">
                                <Camera className="w-3 h-3" />
                                <span>{technician.media.filter(m => m.type === 'image').length}</span>
                                <Video className="w-3 h-3 ml-1" />
                                <span>{technician.media.filter(m => m.type === 'video').length}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex flex-col space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleTechnicianStatus(technician.id, technician.isActive)}
                          >
                            {technician.isActive ? (
                              <>
                                <EyeOff className="w-3 h-3 mr-1" />
                                下线
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3 mr-1" />
                                上线
                              </>
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(technician)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            编辑
                          </Button>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteTechnician(technician.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            删除
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
      
      {/* Toast容器 */}
      <ToastContainer toasts={toasts} onClose={() => {}} />
    </AdminLayout>
  )
} 