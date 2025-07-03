'use client'

import React, { useState, useEffect } from 'react'
import { MessageCircle, X, Download } from 'lucide-react'
import { useDialog, DialogContainer } from './dialog'
import { CustomerService } from '@/lib/data/types'

// 城市主题色配置
const CITY_THEMES = {
  '江苏': { color: 'bg-yellow-500 hover:bg-yellow-600 text-white', textColor: 'text-yellow-600' },
  '杭州': { color: 'bg-blue-500 hover:bg-blue-600 text-white', textColor: 'text-blue-600' },
  '郑州': { color: 'bg-orange-500 hover:bg-orange-600 text-white', textColor: 'text-orange-600' }
}

export function FloatingCustomerService() {
  const { dialogs, showSuccess, showError, removeDialog } = useDialog()
  const [isOpen, setIsOpen] = useState(false)
  const [customerServices, setCustomerServices] = useState<CustomerService[]>([])
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomerServices()
  }, [])

  const fetchCustomerServices = async () => {
    try {
      const response = await fetch('/api/customer-service')
      if (response.ok) {
        const data = await response.json()
        setCustomerServices(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch customer services:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取去重后的城市列表
  const uniqueCities = Array.from(new Set(customerServices.map(service => service.city)))

  // 根据选择的城市获取客服列表
  const getCustomerServicesForCity = (city: string) => {
    // 如果是江苏省内城市，返回江苏客服
    if (['南京', '苏州', '无锡', '常州', '徐州', '南通', '连云港', '淮安', '盐城', '扬州', '镇江', '泰州', '宿迁'].includes(city)) {
      return customerServices.filter(service => service.city === '江苏')
    }
    // 否则返回对应城市客服
    return customerServices.filter(service => service.city === city)
  }

  const copyWechatId = async (wechatId: string) => {
    try {
      await navigator.clipboard.writeText(wechatId)
      showSuccess('复制成功', '微信号已复制到剪贴板！')
    } catch (error) {
      console.error('复制失败:', error)
      // 降级方案：创建临时输入框复制
      const textArea = document.createElement('textarea')
      textArea.value = wechatId
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      showSuccess('复制成功', '微信号已复制到剪贴板！')
    }
  }

  const handleDownloadQR = (qrPath: string, city: string) => {
    const link = document.createElement('a')
    link.href = qrPath
    link.download = `${city}客服二维码.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const selectedServices = selectedCity 
    ? getCustomerServicesForCity(selectedCity)
    : []

  return (
    <>
      {/* 浮动按钮 */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        >
          {isOpen ? (
            <X className="w-6 h-6 transition-transform group-hover:rotate-90" />
          ) : (
            <MessageCircle className="w-6 h-6 transition-transform group-hover:scale-110" />
          )}
        </button>
      </div>

      {/* 客服面板 - 增加移动端自适应 */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[90vw] max-w-96 bg-white rounded-lg shadow-xl border z-50 overflow-hidden md:w-96">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
            <h3 className="font-semibold text-lg">联系客服</h3>
            <p className="text-sm opacity-90">选择您所在的城市客服</p>
          </div>

          {/* 城市选择按钮 */}
          <div className="p-4 bg-gray-50">
            {loading ? (
              <div className="text-center text-gray-500">
                加载中...
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {uniqueCities.map((city) => {
                  const theme = CITY_THEMES[city as keyof typeof CITY_THEMES]
                  const isSelected = selectedCity === city
                  return (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(city)}
                      className={`
                        flex-1 min-w-0 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${isSelected 
                          ? theme?.color || 'bg-blue-500 text-white'
                          : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      {city}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* 客服信息展示区域 */}
          <div className="min-h-[300px] max-h-[70vh] overflow-y-auto">
            {selectedServices.length > 0 ? (
              <div className="p-6">
                {/* 客服标题 */}
                <div className="text-center mb-6">
                  <h4 className="text-xl font-semibold text-gray-900 mb-1">
                    {selectedCity}客服
                  </h4>
                  <p className="text-sm text-gray-600">
                    {selectedServices.length > 1 ? `共 ${selectedServices.length} 位客服人员` : selectedServices[0].workHours}
                  </p>
                </div>

                {/* 多个客服列表 */}
                {selectedServices.map((service, index) => (
                  <div key={service.id} className={`mb-8 ${index > 0 ? 'pt-8 border-t border-gray-200' : ''}`}>
                    {selectedServices.length > 1 && (
                      <h5 className="text-center font-medium text-gray-800 mb-3">客服 {index + 1}</h5>
                    )}
                    
                    {/* 二维码展示 - 3:4比例 */}
                    <div className="flex flex-col items-center mb-6">
                      <div className="w-48 h-64 bg-gray-100 rounded-lg overflow-hidden shadow-md mb-3">
                        {service.qrCodePath ? (
                          <img
                            src={service.qrCodePath + `?t=${Date.now()}`}
                            alt={`${service.city}客服二维码`}
                            width={192}
                            height={256}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-500">暂无二维码</span>
                          </div>
                        )}
                      </div>
                      {/* 下载二维码按钮移到二维码下方 */}
                      {service.qrCodePath && (
                        <button
                          onClick={() => handleDownloadQR(service.qrCodePath, service.city)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium"
                        >
                          <Download className="w-4 h-4" />
                          下载二维码
                        </button>
                      )}
                    </div>
                    
                    {/* 微信号显示和复制按钮在同一行 */}
                    <div className="mb-4 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1 text-sm text-gray-500">
                        微信号：{service.wechatId}
                      </div>
                      <button
                        onClick={() => copyWechatId(service.wechatId)}
                        className="ml-3 px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors font-medium whitespace-nowrap"
                      >
                        复制微信号
                      </button>
                    </div>

                    {/* 工作时间 */}
                    <div className="text-center text-sm text-gray-500">
                      工作时间：{service.workHours}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <div className="text-4xl mb-4">👆</div>
                <p>请选择您所在的城市</p>
                <p className="text-xs mt-2">点击上方城市按钮查看客服信息</p>
              </div>
            )}
          </div>

          {/* 底部提示 */}
          <div className="p-3 bg-gray-50 text-xs text-gray-600 text-center border-t">
            💡 添加客服微信，享受专业SPA服务
          </div>
        </div>
      )}

      {/* 背景遮罩 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Dialog容器 */}
      <DialogContainer dialogs={dialogs} onClose={removeDialog} />
    </>
  )
} 