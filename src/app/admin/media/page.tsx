'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast, ToastContainer } from '@/components/ui/toast';
import { useDialog, DialogContainer } from '@/components/ui/dialog';
import Image from 'next/image';
import { 
  Trash2, 
  Camera, 
  Video, 
  FolderOpen,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface MediaFile {
  id: string;
  fileName: string;
  category: string;
  technicianName: string | null;
  url: string;
  thumbnail: string | null;
  type: 'image' | 'video';
  size: number;
  uploadedAt: string;
}

interface MediaStats {
  totalFiles: number;
  imageFiles: number;
  videoFiles: number;
  withoutMediaTechnicians: number;
}

interface TechnicianGroup {
  id: string;
  nickname: string;
  media: MediaFile[];
  isActive: boolean;
}

export default function AdminMediaPage() {
  const [stats, setStats] = useState<MediaStats>({
    totalFiles: 0,
    imageFiles: 0,
    videoFiles: 0,
    withoutMediaTechnicians: 0
  });
  const [technicianGroups, setTechnicianGroups] = useState<TechnicianGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState('');
  const { toasts, success, error: showError, removeToast } = useToast();
  const { dialogs, showConfirm, removeDialog } = useDialog();

  // 获取媒体文件统计和数据
  const fetchMediaData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/system?action=media-stats', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('获取媒体数据失败');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // 设置统计数据
        setStats(result.data.mediaStats);
        
        // 处理媒体文件分组
        const groups: TechnicianGroup[] = [];
        
        // 按技师分组技师文件
        const technicianFiles = result.data.allMediaFiles.filter((file: MediaFile) => file.category === 'technicians');
        const technicianMap = new Map<string, MediaFile[]>();
        
        technicianFiles.forEach((file: MediaFile) => {
          const technicianName = file.technicianName!;
          if (!technicianMap.has(technicianName)) {
            technicianMap.set(technicianName, []);
          }
          technicianMap.get(technicianName)!.push(file);
        });
        
        // 创建技师组
        technicianMap.forEach((media, technicianName) => {
          groups.push({
            id: technicianName,
            nickname: technicianName,
            media,
            isActive: true
          });
        });
        
        // 添加通用文件组
        const generalFiles = result.data.allMediaFiles.filter((file: MediaFile) => file.category === 'general');
        if (generalFiles.length > 0) {
          groups.push({
            id: 'general',
            nickname: '通用文件',
            media: generalFiles,
            isActive: true
          });
        }
        
        setTechnicianGroups(groups);
      }
    } catch (err) {
      console.error('获取媒体数据失败:', err);
      showError('获取媒体数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMediaData();
  }, []);

  // 删除单个媒体文件
  const deleteMediaFile = async (group: TechnicianGroup, mediaIndex: number, mediaFile: MediaFile) => {
    showConfirm(
      '确认删除',
      `确定要删除这个${mediaFile.type === 'image' ? '图片' : '视频'}吗？此操作不可恢复！`,
      async () => {
        const deleteKey = `${group.id}-${mediaIndex}`;
        setDeleting(deleteKey);

        try {
          const response = await fetch('/api/admin/delete-media', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              technicianId: group.id,
              mediaIndex,
              filePath: mediaFile.url,
              thumbnailPath: mediaFile.thumbnail,
              category: mediaFile.category
            }),
          });

          if (response.ok) {
            await fetchMediaData(); // 重新获取数据
            success('媒体文件删除成功！');
          } else {
            const errorData = await response.json();
            showError(`删除失败: ${errorData.error || '未知错误'}`);
          }
        } catch (err) {
          console.error('删除媒体文件失败:', err);
          showError('删除失败，请重试');
        } finally {
          setDeleting('');
        }
      }
    );
  };

  // 同步媒体文件
  const syncMediaFiles = async () => {
    showConfirm(
      '确认同步',
      '确定要同步媒体文件吗？这将重新扫描所有媒体文件。',
      async () => {
        try {
          await fetchMediaData();
          success('媒体文件同步成功！');
        } catch (err) {
          console.error('同步媒体文件失败:', err);
          showError('同步失败，请重试');
        }
      }
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">媒体文件管理</h1>
            <p className="text-gray-600">管理技师和通用媒体文件</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline"
              onClick={syncMediaFiles}
              className="text-purple-600 border-purple-600 hover:bg-purple-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              同步媒体文件
            </Button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">总媒体文件</p>
                <p className="text-xl font-bold">{stats.totalFiles}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Camera className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">图片文件</p>
                <p className="text-xl font-bold text-green-600">{stats.imageFiles}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Video className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">视频文件</p>
                <p className="text-xl font-bold text-purple-600">{stats.videoFiles}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">无媒体技师</p>
                <p className="text-xl font-bold text-orange-600">{stats.withoutMediaTechnicians}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* 媒体文件列表 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">媒体文件分组</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : technicianGroups.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">暂无媒体文件</p>
            </div>
          ) : (
            <div className="space-y-6">
              {technicianGroups.map((group) => (
                <div key={group.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold">{group.nickname}</h3>
                      {group.id !== 'general' && (
                        <Badge variant={group.isActive ? 'default' : 'destructive'}>
                          {group.isActive ? '已上线' : '已下线'}
                        </Badge>
                      )}
                      {group.id === 'general' && (
                        <Badge variant="secondary">通用文件</Badge>
                      )}
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Camera className="w-4 h-4" />
                        <span>{group.media.filter(m => m.type === 'image').length} 图片</span>
                        <Video className="w-4 h-4 ml-2" />
                        <span>{group.media.filter(m => m.type === 'video').length} 视频</span>
                      </div>
                    </div>
                  </div>

                  {group.media.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">暂无媒体文件</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {group.media.map((mediaFile, index) => (
                        <div key={`${group.id}-${mediaFile.id}-${index}`} className="relative group">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            {mediaFile.type === 'image' ? (
                              <Image
                                src={mediaFile.thumbnail || mediaFile.url}
                                alt={mediaFile.fileName}
                                width={200}
                                height={200}
                                className="w-full h-full object-cover"
                                unoptimized={true}
                                priority={false}
                                onError={(e) => {
                                  console.warn('Image load error:', mediaFile.fileName);
                                  // 如果缩略图加载失败，尝试使用原图
                                  if (mediaFile.thumbnail && e.currentTarget.src === mediaFile.thumbnail) {
                                    e.currentTarget.src = mediaFile.url;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600">
                                <Video className="w-8 h-8 text-white" />
                              </div>
                            )}
                          </div>
                          
                          {/* 删除按钮 */}
                          <button
                            onClick={() => deleteMediaFile(group, index, mediaFile)}
                            disabled={deleting === `${group.id}-${index}`}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                          >
                            {deleting === `${group.id}-${index}` ? (
                              <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                          
                          {/* 文件信息 */}
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 truncate" title={mediaFile.fileName}>
                              {mediaFile.fileName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {(mediaFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 说明信息 */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900 mb-2">媒体文件管理说明：</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 删除媒体文件将同时删除服务器上的实际文件和缩略图</li>
                <li>• 删除技师时会自动删除该技师的所有媒体文件</li>
                <li>• 通用文件不属于特定技师，删除技师时不会被删除</li>
                <li>• 建议定期使用"同步媒体文件"功能确保数据一致性</li>
                <li>• 支持的格式：图片(JPEG, PNG, WebP)，视频(MP4, WebM, MOV)</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
      
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <DialogContainer dialogs={dialogs} onClose={removeDialog} />
    </AdminLayout>
  );
} 