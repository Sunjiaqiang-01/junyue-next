'use client';

import { useState, useRef } from 'react';
import { CustomerService } from '@/lib/data/types';

interface CustomerServiceFormProps {
  customerService?: CustomerService;
  onSubmit: (data: Partial<CustomerService> & { qrCodeFile?: File }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const CITIES = [
  { value: '江苏', label: '江苏', color: 'text-yellow-600' },
  { value: '苏州', label: '苏州', color: 'text-green-600' },
  { value: '杭州', label: '杭州', color: 'text-blue-600' },
  { value: '郑州', label: '郑州', color: 'text-orange-600' }
];

// 江苏省城市列表，用于支持城市选择
const JIANGSU_CITIES = [
  { value: 'nanjing', label: '南京' },
  { value: 'suzhou', label: '苏州' },
  { value: 'wuxi', label: '无锡' },
  { value: 'changzhou', label: '常州' },
  { value: 'xuzhou', label: '徐州' },
  { value: 'nantong', label: '南通' },
  { value: 'lianyungang', label: '连云港' },
  { value: 'huaian', label: '淮安' },
  { value: 'yancheng', label: '盐城' },
  { value: 'yangzhou', label: '扬州' },
  { value: 'zhenjiang', label: '镇江' },
  { value: 'taizhou', label: '泰州' },
  { value: 'suqian', label: '宿迁' }
];

export function CustomerServiceForm({ 
  customerService, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: CustomerServiceFormProps) {
  const [formData, setFormData] = useState({
    city: customerService?.city || '',
    wechatId: customerService?.wechatId || '',
    workHours: customerService?.workHours || '9:00-23:00',
    isActive: customerService?.isActive ?? true,
    supportCities: customerService?.supportCities || []
  });
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string>(
    customerService?.qrCodePath || ''
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.city.trim()) {
      newErrors.city = '请选择城市';
    }

    if (!formData.wechatId.trim()) {
      newErrors.wechatId = '请输入微信号';
    } else if (formData.wechatId.length < 3) {
      newErrors.wechatId = '微信号至少3个字符';
    }

    if (!formData.workHours.trim()) {
      newErrors.workHours = '请输入工作时间';
    }

    if (!customerService && !qrCodeFile) {
      newErrors.qrCode = '请上传二维码图片';
    }

    // 如果选择了江苏，但没有选择任何支持城市
    if (formData.city === '江苏' && formData.supportCities.length === 0) {
      newErrors.supportCities = '请选择至少一个支持的城市';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, qrCode: '请选择图片文件' }));
        return;
      }

      // 验证文件大小 (2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, qrCode: '图片大小不能超过2MB' }));
        return;
      }

      setQrCodeFile(file);
      setErrors(prev => ({ ...prev, qrCode: '' }));

      // 创建预览
      const reader = new FileReader();
      reader.onload = (e) => {
        setQrCodePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setFormLoading(true);
    
    try {
      // 准备基本信息
      const customerServiceData = {
        city: formData.city,
        wechatId: formData.wechatId,
        workHours: formData.workHours,
        isActive: formData.isActive,
        supportCities: formData.supportCities
      };
      
      // 对于新增客服，直接传递二维码的 File 对象给上级组件处理
      if (!customerService && qrCodeFile) {
        // 新增客服，将文件对象传递给父组件
        await onSubmit({
          ...customerServiceData,
          qrCodeFile
        });
      } 
      // 对于编辑客服，如果有新的二维码文件，则通过专门的API上传
      else if (customerService?.id && qrCodeFile) {
        // 先更新基本信息
        await onSubmit(customerServiceData);
        
        // 然后上传二维码
        const formDataUpload = new FormData();
        formDataUpload.append('file', qrCodeFile);
        formDataUpload.append('customerId', customerService.id);

        const uploadResponse = await fetch('/api/admin/customer-service-upload', {
          method: 'POST',
          body: formDataUpload,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || '二维码上传失败');
        }

        // 刷新页面以显示新上传的二维码
        window.location.reload();
      }
      // 如果没有新的二维码文件，只更新基本信息
      else {
        await onSubmit(customerServiceData);
      }
      
      // 成功处理
      setFormLoading(false);
      
    } catch (error) {
      console.error('提交失败:', error);
      setErrors(prev => ({ 
        ...prev, 
        submit: '提交失败，请重试'
      }));
      setFormLoading(false);
    }
  };

  // 处理江苏省支持城市的变化
  const handleSupportCityChange = (cityValue: string) => {
    setFormData(prev => {
      const currentCities = [...prev.supportCities];
      const cityIndex = currentCities.indexOf(cityValue);
      
      if (cityIndex >= 0) {
        // 如果已存在，则移除
        currentCities.splice(cityIndex, 1);
      } else {
        // 如果不存在，则添加
        currentCities.push(cityValue);
      }
      
      return {
        ...prev,
        supportCities: currentCities
      };
    });
  };

  // 全选/取消全选江苏省城市
  const handleSelectAllJiangsuCities = () => {
    setFormData(prev => {
      if (prev.supportCities.length === JIANGSU_CITIES.length) {
        // 如果已全选，则取消全选
        return { ...prev, supportCities: [] };
      } else {
        // 否则全选
        return { ...prev, supportCities: JIANGSU_CITIES.map(city => city.value) };
    }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">
            {customerService ? '编辑客服' : '添加客服'}
          </h2>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 城市选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              城市 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.city ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            >
              <option value="">请选择城市</option>
              {CITIES.map(city => (
                <option key={city.value} value={city.value}>
                  {city.label}
                </option>
              ))}
            </select>
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city}</p>
            )}
          </div>

          {/* 江苏省支持城市选择 */}
          {formData.city === '江苏' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                支持城市 <span className="text-red-500">*</span>
                <button 
                  type="button" 
                  onClick={handleSelectAllJiangsuCities}
                  className="ml-2 text-xs text-blue-600 hover:underline"
                >
                  {formData.supportCities.length === JIANGSU_CITIES.length ? '取消全选' : '全选'}
                </button>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {JIANGSU_CITIES.map(city => (
                  <label key={city.value} className="flex items-center space-x-2">
                    <input 
                      type="checkbox"
                      checked={formData.supportCities.includes(city.value)}
                      onChange={() => handleSupportCityChange(city.value)}
                      className="rounded text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm">{city.label}</span>
                  </label>
                ))}
              </div>
              {errors.supportCities && (
                <p className="mt-1 text-sm text-red-600">{errors.supportCities}</p>
              )}
            </div>
          )}

          {/* 微信号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              微信号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.wechatId}
              onChange={(e) => setFormData(prev => ({ ...prev, wechatId: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.wechatId ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="请输入微信号"
              disabled={isLoading}
            />
            {errors.wechatId && (
              <p className="mt-1 text-sm text-red-600">{errors.wechatId}</p>
            )}
          </div>

          {/* 工作时间 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              工作时间 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.workHours}
              onChange={(e) => setFormData(prev => ({ ...prev, workHours: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.workHours ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="例如：9:00-23:00"
              disabled={isLoading}
            />
            {errors.workHours && (
              <p className="mt-1 text-sm text-red-600">{errors.workHours}</p>
            )}
          </div>

          {/* 二维码上传 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              二维码图片 {!customerService && <span className="text-red-500">*</span>}
            </label>
            
            {/* 当前二维码预览 */}
            {qrCodePreview && (
              <div className="mb-3">
                <img
                  src={qrCodePreview}
                  alt="二维码预览"
                  className="w-24 h-24 object-cover rounded-lg border"
                />
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading}
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📱</div>
                <div className="text-sm text-gray-600">
                  {qrCodeFile ? '重新选择图片' : '点击上传二维码'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  支持 JPG、PNG 格式，大小不超过 2MB
                </div>
              </div>
            </button>
            
            {errors.qrCode && (
              <p className="mt-1 text-sm text-red-600">{errors.qrCode}</p>
            )}
          </div>

          {/* 激活状态 */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isLoading}
              />
              <span className="ml-2 text-sm text-gray-700">激活状态</span>
            </label>
          </div>

          {/* 错误提示 */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  提交中...
                </>
              ) : (
                customerService ? '更新' : '添加'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 