'use client';

import { useState, useRef } from 'react';
import { CustomerService } from '@/lib/data/types';

interface CustomerServiceFormProps {
  customerService?: CustomerService;
  onSubmit: (data: Partial<CustomerService>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const CITIES = [
  { value: '南京', label: '南京', color: 'text-yellow-600' },
  { value: '苏州', label: '苏州', color: 'text-green-600' },
  { value: '杭州', label: '杭州', color: 'text-blue-600' },
  { value: '武汉', label: '武汉', color: 'text-pink-600' },
  { value: '郑州', label: '郑州', color: 'text-orange-600' }
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
    isActive: customerService?.isActive ?? true
  });
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string>(
    customerService?.qrCodePath || ''
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
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

    try {
      let submitData: any = { ...formData };

      // 如果有新的二维码文件，先上传
      if (qrCodeFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', qrCodeFile);
        uploadFormData.append('type', 'customer-service');
        uploadFormData.append('city', formData.city);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          },
          body: uploadFormData
        });

        if (!uploadResponse.ok) {
          throw new Error('图片上传失败');
        }

        const uploadResult = await uploadResponse.json();
        submitData.qrCodePath = uploadResult.url;
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('提交失败:', error);
      setErrors(prev => ({ 
        ...prev, 
        submit: error instanceof Error ? error.message : '提交失败，请重试' 
      }));
    }
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