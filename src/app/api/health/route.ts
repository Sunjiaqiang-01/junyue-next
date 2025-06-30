import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * 健康检查API端点
 * 用于Docker容器健康检查和监控
 */
export async function GET(request: NextRequest) {
  try {
    // 获取系统信息
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const memUsage = Math.round((1 - freeMem / totalMem) * 100);
    const uptime = Math.floor(os.uptime());
    const cpuLoad = os.loadavg()[0];
    
    // 检查是否需要完整系统信息（仪表盘用）
    const { searchParams } = new URL(request.url);
    const isDashboard = searchParams.get('dashboard') === 'true';
    const viewsPeriod = searchParams.get('period') || 'day'; // day, week, month
    
    // 构建基本响应
    const response: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: uptime,
      memory: {
        total: Math.round(totalMem / 1024 / 1024 / 1024 * 10) / 10 + 'GB',
        free: Math.round(freeMem / 1024 / 1024 / 1024 * 10) / 10 + 'GB',
        usage: memUsage + '%'
      },
      cpu: {
        load: cpuLoad.toFixed(2)
      },
      platform: os.platform(),
      hostname: os.hostname()
    };
    
    // 如果是仪表盘请求，添加更多详细信息
    if (isDashboard) {
      // 获取技师和公告真实数据
      const technicianData = await getTechnicianData();
      const announcementData = await getAnnouncementData();
      
      // 获取技师访问数据
      const technicianViewsData = await getTechnicianViewsData(viewsPeriod);
      
      // CPU使用率计算
      const cpuUsage = await getCpuUsage();
      
      // 磁盘使用情况（模拟）
      const diskTotal = 50; // GB
      const diskUsed = 25; // GB
      const diskUsage = Math.round((diskUsed / diskTotal) * 100);
      
      response.dashboard = {
        status: cpuUsage > 85 ? 'critical' : cpuUsage > 70 ? 'warning' : 'normal',
        cpu: {
          usage: cpuUsage,
          cores: os.cpus().length,
          loadAvg: cpuLoad
        },
        memory: {
          usage: memUsage,
          used: Math.round(totalMem / 1024 / 1024 / 1024 * 10 - freeMem / 1024 / 1024 / 1024 * 10) / 10, // GB
          total: Math.round(totalMem / 1024 / 1024 / 1024 * 10) / 10, // GB
          free: Math.round(freeMem / 1024 / 1024 / 1024 * 10) / 10 // GB
        },
        disk: {
          usage: diskUsage,
          free: diskTotal - diskUsed,
          total: diskTotal,
          used: diskUsed
        },
        system: {
          hostname: os.hostname(),
          platform: `${os.platform()} ${os.release()}`,
          arch: os.arch(),
          uptime: Math.round(uptime / 3600), // 转换为小时
          distro: process.platform === 'linux' ? 'Ubuntu Server' : os.platform()
        },
        technicians: technicianData,
        announcements: announcementData,
        technicianRanking: technicianViewsData,
        viewsPeriod
      };
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { status: 'unhealthy', error: 'Health check failed' },
      { status: 500 }
    );
  }
}

/**
 * 获取技师数据
 */
async function getTechnicianData() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'technicians.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const technicians = data.technicians || [];
    
    // 计算活跃技师数量
    const active = technicians.filter((tech: any) => tech.isActive).length;
    
    // 生成城市分布数据
    const cityDistribution = technicians.reduce((acc: any, tech: any) => {
      if (tech.cities && tech.cities.length > 0) {
        tech.cities.forEach((city: string) => {
          acc[city] = (acc[city] || 0) + 1;
        });
      }
      return acc;
    }, {});
    
    return {
      total: technicians.length,
      active,
      cityDistribution
    };
  } catch (error) {
    console.error('Failed to get technician data:', error);
    return { total: 0, active: 0, cityDistribution: {} };
      }
}

/**
 * 获取技师访问数据
 */
async function getTechnicianViewsData(period: string) {
  try {
    const viewsPath = path.join(process.cwd(), 'data', 'technician-views.json');
    if (!fs.existsSync(viewsPath)) {
      return [];
    }
    
    const viewsData = JSON.parse(fs.readFileSync(viewsPath, 'utf8'));
    const views = viewsData.views || [];

    // 根据时间段筛选数据
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        const day = startDate.getDay() || 7;
        startDate.setDate(startDate.getDate() - day + 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
    }
    
    const filteredViews = views.filter((view: any) => {
      const viewDate = new Date(view.timestamp);
      return viewDate >= startDate && viewDate <= now;
    });
    
    // 计算每个技师的访问量
    const viewsCount: Record<string, number> = {};
    
    filteredViews.forEach((view: any) => {
      const { technicianId } = view;
      viewsCount[technicianId] = (viewsCount[technicianId] || 0) + 1;
    });
    
    // 获取技师名称
    const techniciansPath = path.join(process.cwd(), 'data', 'technicians.json');
    const techniciansData = JSON.parse(fs.readFileSync(techniciansPath, 'utf8'));
    const technicians = techniciansData.technicians || [];
    
    // 创建技师ID到名称的映射
    const technicianNames: Record<string, string> = {};
    technicians.forEach((tech: any) => {
      technicianNames[tech.id] = tech.nickname;
    });
    
    // 转换为排序后的数组，包含技师名称
    return Object.entries(viewsCount)
      .map(([id, count]) => ({ 
        id, 
        name: technicianNames[id] || '未知技师', 
        views: count 
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5); // 只返回前5名
  } catch (error) {
    console.error('Failed to get technician views data:', error);
    return [];
  }
}

/**
 * 获取公告数据
 */
async function getAnnouncementData() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'announcements.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const announcements = data.announcements || [];
    
    // 计算活跃公告数量
    const active = announcements.filter((ann: any) => ann.isActive).length;
    
    // 最近活动
    const recentActivities = announcements
      .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3)
      .map((ann: any) => {
        const updatedTime = new Date(ann.updatedAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - updatedTime.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        
        let timeStr = '';
        if (diffDays > 0) {
          timeStr = `${diffDays}天前`;
        } else if (diffHours > 0) {
          timeStr = `${diffHours}小时前`;
        } else {
          timeStr = `${diffMinutes}分钟前`;
        }
        
        return {
          type: 'announcement',
          message: `${ann.title}`,
          time: timeStr,
          icon: '📢'
        };
      });
    
    return {
      total: announcements.length,
      active,
      recentActivities
    };
  } catch (error) {
    console.error('Failed to get announcement data:', error);
    return { total: 0, active: 0, recentActivities: [] };
  }
}

/**
 * 获取CPU使用率
 */
async function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    const startMeasure = process.cpuUsage();
    const startTime = process.hrtime();

    setTimeout(() => {
      const endMeasure = process.cpuUsage(startMeasure);
      const endTime = process.hrtime(startTime);
      
      const totalTime = endTime[0] * 1000000 + endTime[1] / 1000; // 微秒
      const cpuTime = (endMeasure.user + endMeasure.system); // 微秒
      
      const usage = Math.round((cpuTime / totalTime) * 100);
      resolve(Math.min(usage, 100)); // 限制在100%以内
    }, 100);
  });
}

/**
 * 检查数据文件状态
 */
async function checkDataFiles() {
  try {
    const dataPath = path.join(process.cwd(), 'data');
    const requiredFiles = [
      'technicians.json',
      'announcements.json',
      'customer-service.json',
      'admin.json'
    ];

    const checks: any = {};
    let allHealthy = true;

    for (const file of requiredFiles) {
      const filePath = path.join(dataPath, file);
      try {
        const stats = fs.statSync(filePath);
        checks[file] = {
          exists: true,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          readable: fs.constants.R_OK
        };
      } catch (error) {
        checks[file] = {
          exists: false,
          error: error instanceof Error ? error.message : '文件不存在'
        };
        allHealthy = false;
      }
    }

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      details: checks
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : '检查数据文件失败'
    };
  }
}

/**
 * 检查上传目录状态
 */
async function checkUploadsDirectory() {
  try {
    const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(uploadsPath)) {
      return {
        status: 'unhealthy',
        error: '上传目录不存在'
      };
    }

    const stats = fs.statSync(uploadsPath);
    
    // 检查目录权限
    try {
      fs.accessSync(uploadsPath, fs.constants.R_OK | fs.constants.W_OK);
    } catch (error) {
      return {
        status: 'unhealthy',
        error: '上传目录权限不足'
      };
    }

    return {
      status: 'healthy',
      path: uploadsPath,
      writable: true,
      modified: stats.mtime.toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : '检查上传目录失败'
    };
  }
}

/**
 * 检查磁盘空间
 */
async function checkDiskSpace() {
  try {
    const stats = fs.statSync(process.cwd());
    
    // 简单的磁盘空间检查（在容器环境中可能不准确）
    return {
      status: 'healthy',
      note: '磁盘空间检查在容器环境中可能不准确'
    };
  } catch (error) {
    return {
      status: 'warning',
      error: '无法检查磁盘空间'
    };
  }
}

/**
 * 检查内存使用情况
 */
function checkMemoryUsage() {
  try {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    // 如果内存使用超过85%，标记为警告
    const status = memoryUsagePercent > 85 ? 'warning' : 'healthy';

    return {
      status,
      usage: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
        arrayBuffers: `${Math.round(memUsage.arrayBuffers / 1024 / 1024)}MB`,
      },
      usagePercent: `${memoryUsagePercent.toFixed(2)}%`
    };
  } catch (error) {
    return {
      status: 'error',
      error: '无法检查内存使用情况'
    };
  }
} 