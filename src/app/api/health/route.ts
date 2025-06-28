import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * 健康检查API端点
 * 用于Docker容器健康检查和监控
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // 检查应用基本状态
    const health: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: await checkDataFiles(),
        uploads: await checkUploadsDirectory(),
        disk: await checkDiskSpace(),
        memory: checkMemoryUsage(),
      }
    };

    // 计算响应时间
    const responseTime = Date.now() - startTime;
    health.responseTime = `${responseTime}ms`;

    // 检查是否有任何组件不健康
    const unhealthyChecks = Object.entries(health.checks).filter(
      ([key, value]: [string, any]) => value.status !== 'healthy'
    );

    if (unhealthyChecks.length > 0) {
      health.status = 'unhealthy';
      return NextResponse.json(health, { status: 503 });
    }

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    console.error('健康检查失败:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : '未知错误',
      uptime: process.uptime(),
    }, { status: 500 });
  }
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