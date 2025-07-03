'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { CustomerServiceForm } from '@/components/custom/customer-service-form';
import { CustomerService } from '@/lib/data/types';

export default function CustomerServiceManagement() {
  const [customerServices, setCustomerServices] = useState<CustomerService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomerService, setEditingCustomerService] = useState<CustomerService | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<CustomerService | null>(null);

  useEffect(() => {
    fetchCustomerServices();
  }, []);

  const fetchCustomerServices = async () => {
    try {
      const response = await fetch('/api/admin/customer-service', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomerServices(data.data || []);
      }
    } catch (error) {
      console.error('获取客服信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActiveStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/customer-service/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (response.ok) {
        setCustomerServices(prev => 
          prev.map(cs => 
            cs.id === id ? { ...cs, isActive: !isActive } : cs
          )
        );
      }
    } catch (error) {
      console.error('更新客服状态失败:', error);
    }
  };

  const handleAddCustomerService = () => {
    setEditingCustomerService(null);
    setShowForm(true);
  };

  const handleEditCustomerService = (customerService: CustomerService) => {
    setEditingCustomerService(customerService);
    setShowForm(true);
  };

  const handleDeleteCustomerService = (customerService: CustomerService) => {
    setDeleteConfirm(customerService);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const response = await fetch(`/api/admin/customer-service/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        setCustomerServices(prev => prev.filter(cs => cs.id !== deleteConfirm.id));
        setDeleteConfirm(null);
      } else {
        console.error('删除客服失败');
      }
    } catch (error) {
      console.error('删除客服失败:', error);
    }
  };

  const handleFormSubmit = async (data: Partial<CustomerService> & { qrCodeFile?: File }) => {
    setFormLoading(true);
    try {
      // 检查是否有二维码文件，如果有，则从数据中移除，稍后单独上传
      const qrCodeFile = data.qrCodeFile;
      if (qrCodeFile) {
        delete data.qrCodeFile;
      }

      if (editingCustomerService) {
        // 更新客服
        const response = await fetch(`/api/admin/customer-service/${editingCustomerService.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          const result = await response.json();
          setCustomerServices(prev => 
            prev.map(cs => 
              cs.id === editingCustomerService.id ? result.data : cs
            )
          );
          setShowForm(false);
          setEditingCustomerService(null);

          // 添加完成后刷新页面以确保正确显示二维码
          window.location.reload();
        } else {
          throw new Error('更新客服失败');
        }
      } else {
        // 添加客服
        const response = await fetch('/api/admin/customer-service', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          const result = await response.json();
          
          // 如果有二维码文件，上传它
          if (qrCodeFile) {
            const newCustomerId = result.data.id;
            const formData = new FormData();
            formData.append('file', qrCodeFile);
            formData.append('customerId', newCustomerId);
            
            const uploadResponse = await fetch('/api/admin/customer-service-upload', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
              },
              body: formData
            });
            
            if (uploadResponse.ok) {
              const uploadResult = await uploadResponse.json();
              // 更新客服信息中的二维码路径
              result.data.qrCodePath = uploadResult.data.qrCodePath;
            } else {
              console.error('二维码上传失败');
              const errorData = await uploadResponse.json();
              throw new Error(errorData.error || '二维码上传失败');
            }
          }
          
          setCustomerServices(prev => [...prev, result.data]);
          setShowForm(false);

          // 添加完成后刷新页面以确保正确显示二维码
          window.location.reload();
        } else {
          throw new Error('添加客服失败');
        }
      }
    } catch (error) {
      console.error('操作失败:', error);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCustomerService(null);
  };

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
            <h1 className="text-2xl font-bold text-gray-900">客服管理</h1>
            <p className="text-gray-600">管理各城市客服信息</p>
          </div>
          <button 
            onClick={handleAddCustomerService}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span>💬</span>
            添加客服
          </button>
        </div>

        {/* 客服列表 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">客服列表</h2>
          </div>
          
          <div className="divide-y">
            {customerServices.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                暂无客服信息
              </div>
            ) : (
              customerServices.map((cs) => (
                <div key={cs.id} className="p-6">
                  <div className="flex items-start gap-4">
                    {/* 二维码 */}
                    <div className="flex-shrink-0">
                      <img 
                        src={cs.qrCodePath + `?t=${Date.now()}`} 
                        alt={`${cs.city}客服二维码`}
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                    </div>
                    
                    {/* 客服信息 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{cs.city}客服</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          cs.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {cs.isActive ? '激活' : '未激活'}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>微信号: {cs.wechatId}</div>
                        <div>工作时间: {cs.workHours}</div>
                        {cs.supportCities && cs.supportCities.length > 0 && (
                          <div>
                            支持城市: 
                            <span className="ml-1">
                              {cs.supportCities.map(cityCode => {
                                const cityName = {
                                  'nanjing': '南京',
                                  'suzhou': '苏州',
                                  'wuxi': '无锡',
                                  'changzhou': '常州',
                                  'xuzhou': '徐州',
                                  'nantong': '南通',
                                  'lianyungang': '连云港',
                                  'huaian': '淮安',
                                  'yancheng': '盐城',
                                  'yangzhou': '扬州',
                                  'zhenjiang': '镇江',
                                  'taizhou': '泰州',
                                  'suqian': '宿迁',
                                  'hangzhou': '杭州',
                                  'zhengzhou': '郑州'
                                }[cityCode] || cityCode;
                                return cityName;
                              }).join(', ')}
                            </span>
                          </div>
                        )}
                        <div>更新时间: {new Date(cs.updatedAt).toLocaleString()}</div>
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleActiveStatus(cs.id, cs.isActive)}
                        className={`px-3 py-1 rounded text-sm ${
                          cs.isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {cs.isActive ? '设为未激活' : '设为激活'}
                      </button>
                      <button 
                        onClick={() => handleEditCustomerService(cs)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                      >
                        编辑
                      </button>
                      <button 
                        onClick={() => handleDeleteCustomerService(cs)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">客服总数</h3>
                <p className="text-2xl font-bold text-blue-600">{customerServices.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">激活客服</h3>
                <p className="text-2xl font-bold text-green-600">
                  {customerServices.filter(cs => cs.isActive).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏙️</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">覆盖城市</h3>
                <p className="text-2xl font-bold text-orange-600">
                  {new Set(customerServices.map(cs => cs.city)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 客服表单弹窗 */}
        {showForm && (
          <CustomerServiceForm
            customerService={editingCustomerService || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={formLoading}
          />
        )}

        {/* 删除确认弹窗 */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">确认删除</h3>
                <p className="text-gray-600 mb-6">
                  确定要删除 <span className="font-medium">{deleteConfirm.city}客服</span> 吗？
                  <br />
                  此操作不可撤销。
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}