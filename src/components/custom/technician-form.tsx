'use client'

import React, { useState, useEffect } from 'react'
import { User, MapPin, Phone, Camera, Video, Upload, X, Trash2, ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BaiduMapPicker } from '@/components/ui/baidu-map-picker'
import { Badge } from '@/components/ui/badge'
import { useDialog, DialogContainer } from '@/components/ui/dialog'
import { Technician, TechnicianMedia } from '@/lib/data/types'
import { cn } from '@/lib/utils'

interface TechnicianFormProps {
  initialData?: Partial<Technician>
  onSubmit: (data: Technician) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

interface FormData {
  id?: string
  nickname: string
  age: number
  height: number
  weight: number
  cities: string[]
  features: string
  isActive: boolean
  isRecommended: boolean
  isNew: boolean
  address: string
  latitude: number
  longitude: number
  area: string
  media: TechnicianMedia[]
  createdAt?: string
  updatedAt?: string
}

const cities = [
  { value: 'nanjing', label: '南京' },
  { value: 'suzhou', label: '苏州' },
  { value: 'hangzhou', label: '杭州' },
  { value: 'wuhan', label: '武汉' },
  { value: 'zhengzhou', label: '郑州' }
]

const serviceOptions = [
  '基础舒缓SPA',
  '进阶焕活SPA', 
  '奢华尊享SPA',
  '全身按摩',
  '深度放松',
  '专业护理'
]

export function TechnicianForm({ initialData, onSubmit, onCancel, loading = false }: TechnicianFormProps) {
  const { dialogs, showSuccess, showError, showWarning, showConfirm, removeDialog } = useDialog()
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const [formData, setFormData] = useState<FormData>(() => {
    // 如果有初始数据（编辑模式），使用初始数据
    if (initialData) {
      return {
        nickname: '',
        age: 25,
        height: 175,
        weight: 65,
        cities: ['nanjing'],
        features: '',
        isActive: true,
        isRecommended: false,
        isNew: false,
        address: '',
        latitude: 0,
        longitude: 0,
        area: '',
        media: [],
        ...initialData
      }
    }
    
    // 新增模式，使用空值
    return {
      nickname: '',
      age: 0,
      height: 0,
      weight: 0,
      cities: [],
      features: '',
      isActive: true,
      isRecommended: false,
      isNew: false,
      address: '',
      latitude: 0,
      longitude: 0,
      area: '',
      media: []
    }
  })

  // 处理媒体文件上传（图片和视频一起）
  const handleMediaUpload = async (files: FileList) => {
    if (!formData.nickname.trim()) {
      showWarning('提示', '请先输入技师昵称再上传文件')
      return
    }

    const newMedia: any[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileKey = `media_${Date.now()}_${i}`
      
      // 验证文件类型
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      
      if (!isImage && !isVideo) {
        showError('文件类型错误', `文件 ${file.name} 不是有效的图片或视频格式`)
        continue
      }
      
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('category', 'technicians')
      formDataUpload.append('technicianNickname', formData.nickname)
      
      setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }))

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        })

        if (response.ok) {
          const result = await response.json()
          newMedia.push({
            type: result.data.mediaType,
            path: result.data.fileUrl,
            thumbnail: result.data.thumbnailUrl || result.data.fileUrl,
            description: `${formData.nickname}的${result.data.mediaType === 'image' ? '照片' : '视频'}`,
            sortOrder: formData.media.length + newMedia.length + 1
          })
          setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }))
        } else {
          const errorData = await response.json()
          console.error('Upload failed:', errorData.error)
          showError('上传失败', errorData.error)
        }
      } catch (error) {
        console.error('Upload error:', error)
        showError('上传失败', '网络错误，请重试')
      } finally {
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[fileKey]
            return newProgress
          })
        }, 1000)
      }
    }

    if (newMedia.length > 0) {
      setFormData(prev => ({
        ...prev,
        media: [...prev.media, ...newMedia]
      }))
      showSuccess('上传成功', `成功上传 ${newMedia.length} 个文件`)
    }
  }

  // 删除媒体文件
  const handleDeleteMedia = async (index: number) => {
    const mediaItem = formData.media[index]
    
    showConfirm(
      '确认删除',
      '确定要删除这个媒体文件吗？此操作不可恢复！',
      async () => {
        // 如果是编辑模式且有文件路径，先删除服务器文件
        if (initialData?.id && mediaItem.path) {
          try {
            const response = await fetch('/api/admin/technicians/delete-media', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                technicianId: initialData.id,
                mediaPath: mediaItem.path
              })
            })

            if (!response.ok) {
              const errorData = await response.json()
              showError('删除失败', errorData.error || '未知错误')
              return
            }

            const result = await response.json()
            console.log('媒体文件删除成功:', result)
            
            // 只有服务器删除成功后才从前端状态删除
            setFormData(prev => ({
              ...prev,
              media: prev.media.filter((_, i) => i !== index)
            }))
            showSuccess('删除成功', '媒体文件已删除')
          } catch (error) {
            console.error('删除媒体文件失败:', error)
            showError('删除失败', '网络错误，请重试')
            return
          }
        } else {
          // 如果是新增模式或没有文件路径，直接从前端状态删除
          setFormData(prev => ({
            ...prev,
            media: prev.media.filter((_, i) => i !== index)
          }))
          showSuccess('删除成功', '媒体文件已删除')
        }
      }
    )
  }

  // 处理位置选择
  const handleLocationSelect = (location: { address: string; latitude: number; longitude: number; area: string }) => {
    setFormData(prev => ({
      ...prev,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      area: location.area
    }))
  }

  // 处理城市选择
  const handleCityToggle = (cityValue: string) => {
    setFormData(prev => ({
      ...prev,
      cities: prev.cities.includes(cityValue)
        ? prev.cities.filter(c => c !== cityValue)
        : [...prev.cities, cityValue]
    }))
  }

  // 表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nickname.trim()) {
      showWarning('表单验证', '请输入技师昵称')
      return
    }

    if (formData.media.length === 0) {
      showWarning('表单验证', '请至少上传一张照片或视频')
      return
    }

    if (formData.cities.length === 0) {
      showWarning('表单验证', '请至少选择一个服务城市')
      return
    }

    try {
      const technicianData: Technician = {
        ...formData,
        id: formData.id || `tech_${Date.now()}`,
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      await onSubmit(technicianData)
      showSuccess('操作成功', initialData?.id ? '技师信息更新成功！' : '技师创建成功！')
    } catch (error) {
      console.error('Form submission error:', error)
      showError('操作失败', '请重试')
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本信息 */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">基本信息</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                技师昵称 *
              </label>
              <Input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                placeholder="请输入技师昵称"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                年龄
              </label>
              <Input
                type="number"
                value={formData.age === 0 ? '' : formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                placeholder="请输入年龄"
                min="18"
                max="50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                身高 (cm)
              </label>
              <Input
                type="number"
                value={formData.height === 0 ? '' : formData.height}
                onChange={(e) => setFormData(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                placeholder="请输入身高"
                min="150"
                max="200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                体重 (kg)
              </label>
              <Input
                type="number"
                value={formData.weight === 0 ? '' : formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
                placeholder="请输入体重"
                min="40"
                max="100"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              技师特长描述
            </label>
            <textarea
              value={formData.features}
              onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))}
              placeholder="请输入技师特长和服务特色..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
        </Card>

        {/* 服务城市 */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">服务城市</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {cities.map((city) => (
              <button
                key={city.value}
                type="button"
                onClick={() => handleCityToggle(city.value)}
                className={cn(
                  "px-3 py-2 rounded-full text-sm font-medium transition-colors",
                  formData.cities.includes(city.value)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {city.label}
              </button>
            ))}
          </div>
        </Card>

        {/* 位置信息 */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">位置信息</h3>
          </div>
          
          <BaiduMapPicker
            onLocationSelect={handleLocationSelect}
            defaultLocation={
              formData.latitude && formData.longitude
                ? {
                    address: formData.address,
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    area: formData.area
                  }
                : undefined
            }
          />
        </Card>

        {/* 媒体文件 */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Camera className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">媒体文件</h3>
          </div>
          
          {/* 统一上传按钮 */}
          <div className="mb-4">
            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <div className="text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600">点击上传</span> 或拖拽文件到此处
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  支持图片（JPG、PNG、WebP）和视频（MP4、WebM、MOV）
                </p>
              </div>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleMediaUpload(e.target.files)}
              />
            </label>
          </div>

          {/* 上传进度 */}
          {Object.keys(uploadProgress).length > 0 && (
            <div className="mb-4 space-y-2">
              {Object.entries(uploadProgress).map(([key, progress]) => (
                <div key={key} className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* 媒体文件预览 */}
          {formData.media.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.media.map((item, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    {item.type === 'image' ? (
                      <img
                        src={item.thumbnail || item.path}
                        alt={item.description}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <Video className="w-8 h-8 text-white" />
                        <span className="absolute bottom-1 right-1 text-xs bg-black/70 text-white px-1 rounded">
                          视频
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* 删除按钮 */}
                  <button
                    type="button"
                    onClick={() => handleDeleteMedia(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 特殊标识 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">特殊标识</h3>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">启用显示（技师在前台可见）</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecommended}
                onChange={(e) => setFormData(prev => ({ ...prev, isRecommended: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">推荐技师</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isNew}
                onChange={(e) => setFormData(prev => ({ ...prev, isNew: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">新技师</span>
            </label>
          </div>
        </Card>

        {/* 提交按钮 */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? '保存中...' : (initialData?.id ? '更新技师' : '创建技师')}
          </Button>
        </div>
      </form>

      {/* Dialog容器 */}
      <DialogContainer dialogs={dialogs} onClose={removeDialog} />
    </>
  )
} 