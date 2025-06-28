'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';

interface SystemSettings {
  site: {
    title: string;
    description: string;
    keywords: string;
    logo: string;
  };
  business: {
    workingHours: string;
    contactPhone: string;
    contactEmail: string;
    address: string;
  };
  upload: {
    maxFileSize: number;
    allowedImageTypes: string[];
    allowedVideoTypes: string[];
    maxImagesPerTechnician: number;
    maxVideosPerTechnician: number;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    enableTwoFactor: boolean;
  };
  performance: {
    cacheEnabled: boolean;
    cacheTTL: number;
    compressionEnabled: boolean;
    lazyLoadingEnabled: boolean;
  };
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('site');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // 模拟获取系统设置
      const mockSettings: SystemSettings = {
        site: {
          title: '君悦彩虹SPA技师展示网站',
          description: '专业的SPA技师服务平台，提供优质的按摩和放松服务',
          keywords: 'SPA,按摩,技师,放松,养生,保健',
          logo: '/assets/logo.png'
        },
        business: {
          workingHours: '09:00-23:00',
          contactPhone: '400-888-8888',
          contactEmail: 'contact@junyuecaihong.com',
          address: '香港特别行政区'
        },
        upload: {
          maxFileSize: 10, // MB
          allowedImageTypes: ['jpg', 'jpeg', 'png', 'webp'],
          allowedVideoTypes: ['mp4', 'mov', 'avi'],
          maxImagesPerTechnician: 10,
          maxVideosPerTechnician: 3
        },
        security: {
          sessionTimeout: 24, // hours
          maxLoginAttempts: 5,
          passwordMinLength: 8,
          enableTwoFactor: false
        },
        performance: {
          cacheEnabled: true,
          cacheTTL: 3600, // seconds
          compressionEnabled: true,
          lazyLoadingEnabled: true
        }
      };
      setSettings(mockSettings);
    } catch (error) {
      console.error('获取设置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      // 这里应该调用保存设置的API
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟保存
      alert('设置保存成功！');
    } catch (error) {
      console.error('保存设置失败:', error);
      alert('保存设置失败！');
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (section: keyof SystemSettings, field: string, value: any) => {
    if (!settings) return;
    
    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value
      }
    }));
  };

  const tabs = [
    { id: 'site', name: '网站设置', icon: '🌐' },
    { id: 'business', name: '业务设置', icon: '🏢' },
    { id: 'upload', name: '上传设置', icon: '📁' },
    { id: 'security', name: '安全设置', icon: '🔒' },
    { id: 'performance', name: '性能设置', icon: '⚡' }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-lg">加载中...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
            <p className="text-gray-600">配置网站各项参数和功能</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span>💾</span>
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          {/* 标签页导航 */}
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* 设置内容 */}
          <div className="p-6">
            {/* 网站设置 */}
            {activeTab === 'site' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">网站基本信息</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      网站标题
                    </label>
                    <input
                      type="text"
                      value={settings!.site.title}
                      onChange={(e) => updateSettings('site', 'title', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      网站描述
                    </label>
                    <textarea
                      value={settings!.site.description}
                      onChange={(e) => updateSettings('site', 'description', e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      关键词 (用逗号分隔)
                    </label>
                    <input
                      type="text"
                      value={settings!.site.keywords}
                      onChange={(e) => updateSettings('site', 'keywords', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      网站Logo路径
                    </label>
                    <input
                      type="text"
                      value={settings!.site.logo}
                      onChange={(e) => updateSettings('site', 'logo', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 业务设置 */}
            {activeTab === 'business' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">业务信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      营业时间
                    </label>
                    <input
                      type="text"
                      value={settings!.business.workingHours}
                      onChange={(e) => updateSettings('business', 'workingHours', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      联系电话
                    </label>
                    <input
                      type="text"
                      value={settings!.business.contactPhone}
                      onChange={(e) => updateSettings('business', 'contactPhone', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      联系邮箱
                    </label>
                    <input
                      type="email"
                      value={settings!.business.contactEmail}
                      onChange={(e) => updateSettings('business', 'contactEmail', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      地址
                    </label>
                    <input
                      type="text"
                      value={settings!.business.address}
                      onChange={(e) => updateSettings('business', 'address', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 上传设置 */}
            {activeTab === 'upload' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">文件上传限制</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      最大文件大小 (MB)
                    </label>
                    <input
                      type="number"
                      value={settings!.upload.maxFileSize}
                      onChange={(e) => updateSettings('upload', 'maxFileSize', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      每个技师最大图片数
                    </label>
                    <input
                      type="number"
                      value={settings!.upload.maxImagesPerTechnician}
                      onChange={(e) => updateSettings('upload', 'maxImagesPerTechnician', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      每个技师最大视频数
                    </label>
                    <input
                      type="number"
                      value={settings!.upload.maxVideosPerTechnician}
                      onChange={(e) => updateSettings('upload', 'maxVideosPerTechnician', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      允许的图片格式
                    </label>
                    <input
                      type="text"
                      value={settings!.upload.allowedImageTypes.join(', ')}
                      onChange={(e) => updateSettings('upload', 'allowedImageTypes', e.target.value.split(', '))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      允许的视频格式
                    </label>
                    <input
                      type="text"
                      value={settings!.upload.allowedVideoTypes.join(', ')}
                      onChange={(e) => updateSettings('upload', 'allowedVideoTypes', e.target.value.split(', '))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 安全设置 */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">安全配置</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      会话超时时间 (小时)
                    </label>
                    <input
                      type="number"
                      value={settings!.security.sessionTimeout}
                      onChange={(e) => updateSettings('security', 'sessionTimeout', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      最大登录尝试次数
                    </label>
                    <input
                      type="number"
                      value={settings!.security.maxLoginAttempts}
                      onChange={(e) => updateSettings('security', 'maxLoginAttempts', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      密码最小长度
                    </label>
                    <input
                      type="number"
                      value={settings!.security.passwordMinLength}
                      onChange={(e) => updateSettings('security', 'passwordMinLength', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings!.security.enableTwoFactor}
                        onChange={(e) => updateSettings('security', 'enableTwoFactor', e.target.checked)}
                        className="mr-2"
                      />
                      启用双因子认证
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 性能设置 */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">性能优化</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings!.performance.cacheEnabled}
                        onChange={(e) => updateSettings('performance', 'cacheEnabled', e.target.checked)}
                        className="mr-2"
                      />
                      启用缓存
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      缓存过期时间 (秒)
                    </label>
                    <input
                      type="number"
                      value={settings!.performance.cacheTTL}
                      onChange={(e) => updateSettings('performance', 'cacheTTL', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings!.performance.compressionEnabled}
                        onChange={(e) => updateSettings('performance', 'compressionEnabled', e.target.checked)}
                        className="mr-2"
                      />
                      启用压缩
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings!.performance.lazyLoadingEnabled}
                        onChange={(e) => updateSettings('performance', 'lazyLoadingEnabled', e.target.checked)}
                        className="mr-2"
                      />
                      启用懒加载
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 