'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { MiniChart } from '@/components/ui/mini-chart';
import { 
  HardDrive, 
  Cpu, 
  MemoryStick, 
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  TrendingUp
} from 'lucide-react';

interface SystemData {
  timestamp: string;
  status: 'normal' | 'warning' | 'critical';
  alerts: Array<{
    type: 'warning' | 'critical';
    message: string;
  }>;
  cpu: {
    usage: number;
    cores: number;
    loadAvg: number;
  };
  memory: {
    usage: number;
    used: string;
    total: string;
    free: string;
  };
  disk: {
    usage: number;
    free: string;
    total: string;
    used: string;
  };
  network: {
    rx: string;
    tx: string;
  };
  system: {
    hostname: string;
    platform: string;
    arch: string;
    uptime: number;
    distro: string;
  };
  processes: {
    total: number;
    running: number;
    blocked: number;
  };
}

export default function SystemMonitoringPage() {
  const [systemData, setSystemData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [performanceHistory, setPerformanceHistory] = useState({
    cpu: [45, 52, 48, 61, 55, 67, 43, 49, 38, 42],
    memory: [62, 58, 65, 63, 67, 64, 61, 59, 55, 58],
    disk: [23, 25, 24, 26, 28, 27, 25, 24, 23, 25]
  });

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/system', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        setSystemData(result); // API现在直接返回系统数据
        setLastUpdate(new Date());
        
        // 更新性能历史数据（模拟实时数据）
        setPerformanceHistory(prev => ({
          cpu: [...prev.cpu.slice(1), result.cpu.usage],
          memory: [...prev.memory.slice(1), result.memory.usage],
          disk: [...prev.disk.slice(1), result.disk.usage]
        }));
      } else {
        console.error('获取系统数据失败');
        setSystemData(null);
      }
    } catch (error) {
      console.error('获取系统数据错误:', error);
      setSystemData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchSystemData, 5000); // 每5秒刷新
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return <XCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      default: return <CheckCircle className="w-5 h-5" />;
    }
  };

  const formatUptime = (hours: number) => {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}天 ${remainingHours}小时`;
  };



  if (loading && !systemData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin" style={{ color: '#1A2B5C' }} />
            <span className="text-lg">正在获取系统信息...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!systemData) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">无法获取系统信息</h3>
          <button
            onClick={fetchSystemData}
            className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#1A2B5C' }}
          >
            重试
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      {/* 页面标题和控制栏 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1A2B5C' }}>系统监控</h1>
          <p className="text-gray-600 mt-1">实时监控服务器性能和资源使用情况</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span>自动刷新</span>
            </label>
          </div>
          
          <button
            onClick={fetchSystemData}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#1A2B5C' }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>
        </div>
      </div>

      {/* 告警信息 */}
      {systemData.alerts && systemData.alerts.length > 0 && (
        <div className="space-y-2">
          {systemData.alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                alert.type === 'critical' 
                  ? 'bg-red-50 border-red-200 text-red-800' 
                  : 'bg-yellow-50 border-yellow-200 text-yellow-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">{alert.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 系统状态概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 系统状态 */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">系统状态</p>
              <div className={`flex items-center space-x-2 mt-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(systemData.status)}`}>
                {getStatusIcon(systemData.status)}
                <span className="capitalize">
                  {systemData.status === 'normal' ? '正常' : 
                   systemData.status === 'warning' ? '警告' : '严重'}
                </span>
              </div>
            </div>
            <Server className="w-8 h-8 text-gray-400" />
          </div>
        </Card>

        {/* CPU使用率 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">CPU使用率</p>
              <p className="text-xs text-gray-500 mt-1">{systemData.cpu.cores} 核心</p>
            </div>
            <Cpu className="w-6 h-6 text-gray-400" />
          </div>
          <div className="flex items-center justify-between">
            <ProgressRing 
              progress={systemData.cpu.usage} 
              size={80}
              strokeWidth={6}
            />
            <div className="flex-1 ml-4">
              <MiniChart 
                data={performanceHistory.cpu}
                color="#1A2B5C"
                height={60}
                type="area"
              />
            </div>
          </div>
        </Card>

        {/* 内存使用率 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">内存使用率</p>
              <p className="text-xs text-gray-500 mt-1">
                {systemData.memory.used}GB / {systemData.memory.total}GB
              </p>
            </div>
            <MemoryStick className="w-6 h-6 text-gray-400" />
          </div>
          <div className="flex items-center justify-between">
            <ProgressRing 
              progress={systemData.memory.usage} 
              size={80}
              strokeWidth={6}
            />
            <div className="flex-1 ml-4">
              <MiniChart 
                data={performanceHistory.memory}
                color="#059669"
                height={60}
                type="area"
              />
            </div>
          </div>
        </Card>

        {/* 磁盘使用率 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">磁盘使用率</p>
              <p className="text-xs text-gray-500 mt-1">
                剩余 {systemData.disk.free}GB
              </p>
            </div>
            <HardDrive className="w-6 h-6 text-gray-400" />
          </div>
          <div className="flex items-center justify-between">
            <ProgressRing 
              progress={systemData.disk.usage} 
              size={80}
              strokeWidth={6}
            />
            <div className="flex-1 ml-4">
              <MiniChart 
                data={performanceHistory.disk}
                color="#DC2626"
                height={60}
                type="area"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* 性能概览图表 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold" style={{ color: '#1A2B5C' }}>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>性能趋势</span>
            </div>
          </h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1A2B5C' }}></div>
              <span>CPU</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <span>内存</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span>磁盘</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">CPU 使用率趋势</p>
            <MiniChart 
              data={performanceHistory.cpu}
              color="#1A2B5C"
              height={120}
              type="area"
              showGrid={true}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">内存使用率趋势</p>
            <MiniChart 
              data={performanceHistory.memory}
              color="#059669"
              height={120}
              type="area"
              showGrid={true}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">磁盘使用率趋势</p>
            <MiniChart 
              data={performanceHistory.disk}
              color="#DC2626"
              height={120}
              type="area"
              showGrid={true}
            />
          </div>
        </div>
      </Card>

      {/* 详细信息 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 系统信息 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#1A2B5C' }}>系统信息</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">主机名</span>
              <span className="font-medium">{systemData.system.hostname}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">操作系统</span>
              <span className="font-medium">{systemData.system.platform}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">架构</span>
              <span className="font-medium">{systemData.system.arch}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">运行时间</span>
              <span className="font-medium">{formatUptime(systemData.system.uptime)}</span>
            </div>
            {systemData.system.distro && (
              <div className="flex justify-between">
                <span className="text-gray-600">发行版</span>
                <span className="font-medium">{systemData.system.distro}</span>
              </div>
            )}
          </div>
        </Card>

        {/* 网络和进程信息 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#1A2B5C' }}>网络和进程</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">网络接收</span>
              <span className="font-medium">{systemData.network.rx} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">网络发送</span>
              <span className="font-medium">{systemData.network.tx} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">总进程数</span>
              <span className="font-medium">{systemData.processes.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">运行中进程</span>
              <span className="font-medium">{systemData.processes.running}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">阻塞进程</span>
              <span className="font-medium">{systemData.processes.blocked}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 最后更新时间 */}
      <div className="text-center text-sm text-gray-500">
        <div className="flex items-center justify-center space-x-2">
          <Clock className="w-4 h-4" />
          <span>
            最后更新: {lastUpdate ? lastUpdate.toLocaleString('zh-CN') : '未知'}
          </span>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
} 