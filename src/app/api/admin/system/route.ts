import { NextRequest, NextResponse } from 'next/server';
import { jsonStorage } from '@/lib/json-storage';
import { verifyAdmin } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';

// 获取系统状态监控信息
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdmin(request);
    if (!authResult.success) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'media-stats') {
      // 获取媒体文件统计信息（包括general文件夹）
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      let totalFiles = 0;
      let imageFiles = 0;
      let videoFiles = 0;
      const allMediaFiles: any[] = [];

      // 扫描technicians文件夹
      const techniciansDir = path.join(uploadsDir, 'technicians');
      if (existsSync(techniciansDir)) {
        const technicianFolders = await readdir(techniciansDir);
        for (const folder of technicianFolders) {
          const folderPath = path.join(techniciansDir, folder);
          const folderStat = await stat(folderPath);
          if (folderStat.isDirectory()) {
            const files = await readdir(folderPath);
            for (const file of files) {
              if (file === 'thumbnails') continue; // 跳过缩略图文件夹
              
              const filePath = path.join(folderPath, file);
              const fileStat = await stat(filePath);
              if (fileStat.isFile()) {
                const isImage = /\.(jpg|jpeg|png|webp)$/i.test(file);
                const isVideo = /\.(mp4|webm|mov)$/i.test(file);
                
                if (isImage || isVideo) {
                  totalFiles++;
                  if (isImage) imageFiles++;
                  if (isVideo) videoFiles++;
                  
                  // 查找对应的缩略图
                  const thumbnailDir = path.join(folderPath, 'thumbnails');
                  let thumbnailUrl = null;
                  if (existsSync(thumbnailDir)) {
                    const thumbnailFiles = await readdir(thumbnailDir);
                    const baseName = path.parse(file).name; // 获取不带扩展名的文件名
                    
                    // 精确匹配缩略图文件
                    const thumbnailFile = thumbnailFiles.find(t => {
                      // 匹配 thumb_原文件名.jpg 或 thumb_原文件名_时间戳_随机字符.jpg
                      return t.startsWith(`thumb_${baseName}`) && t.endsWith('.jpg');
                    });
                    
                    if (thumbnailFile) {
                      thumbnailUrl = `/uploads/technicians/${folder}/thumbnails/${thumbnailFile}`;
                    }
                  }
                  
                  allMediaFiles.push({
                    id: `technician_${folder}_${file}`,
                    fileName: file,
                    category: 'technicians',
                    technicianName: folder,
                    url: `/uploads/technicians/${folder}/${file}`,
                    thumbnail: thumbnailUrl,
                    type: isImage ? 'image' : 'video',
                    size: fileStat.size,
                    uploadedAt: fileStat.birthtime
                  });
                }
              }
            }
          }
        }
      }

      // 扫描general文件夹
      const generalDir = path.join(uploadsDir, 'general');
      if (existsSync(generalDir)) {
        const files = await readdir(generalDir);
        for (const file of files) {
          if (file === 'thumbnails') continue; // 跳过缩略图文件夹
          
          const filePath = path.join(generalDir, file);
          const fileStat = await stat(filePath);
          if (fileStat.isFile()) {
            const isImage = /\.(jpg|jpeg|png|webp)$/i.test(file);
            const isVideo = /\.(mp4|webm|mov)$/i.test(file);
            
            if (isImage || isVideo) {
              totalFiles++;
              if (isImage) imageFiles++;
              if (isVideo) videoFiles++;
              
              // 查找对应的缩略图
              const thumbnailDir = path.join(generalDir, 'thumbnails');
              let thumbnailUrl = null;
              if (existsSync(thumbnailDir)) {
                const thumbnailFiles = await readdir(thumbnailDir);
                const baseName = path.parse(file).name; // 获取不带扩展名的文件名
                
                // 精确匹配缩略图文件
                const thumbnailFile = thumbnailFiles.find(t => {
                  // 匹配 thumb_原文件名.jpg 或 thumb_原文件名_时间戳_随机字符.jpg
                  return t.startsWith(`thumb_${baseName}`) && t.endsWith('.jpg');
                });
                
                if (thumbnailFile) {
                  thumbnailUrl = `/uploads/general/thumbnails/${thumbnailFile}`;
                }
              }
              
              allMediaFiles.push({
                id: `general_${file}`,
                fileName: file,
                category: 'general',
                technicianName: null,
                url: `/uploads/general/${file}`,
                thumbnail: thumbnailUrl,
                type: isImage ? 'image' : 'video',
                size: fileStat.size,
                uploadedAt: fileStat.birthtime
              });
            }
          }
        }
      }

      // 获取技师数据统计
      const technicians = await jsonStorage.findAll('technicians.json');
      const technicianStats = {
        total: technicians.length,
        active: technicians.filter((t: any) => t.isActive).length,
        withMedia: technicians.filter((t: any) => t.media && t.media.length > 0).length,
        withoutMedia: technicians.filter((t: any) => !t.media || t.media.length === 0).length
      };

      return NextResponse.json({
        success: true,
        data: {
          mediaStats: {
            totalFiles,
            imageFiles,
            videoFiles,
            withoutMediaTechnicians: technicianStats.withoutMedia
          },
          technicianStats,
          allMediaFiles: allMediaFiles.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        }
      });
    }

    // 默认返回完整的系统监控数据
    const cpuUsage = await getCpuUsage();
    const memInfo = process.memoryUsage();
    const diskInfo = await getDiskUsage();
    const storageInfo = await getStorageInfo();
    
    // 计算内存使用率
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = Math.round((usedMem / totalMem) * 100);
    
    // 计算磁盘使用率（模拟）
    const diskUsage = Math.min(Math.round((diskInfo.total / 1024) * 100 / 100), 85); // 模拟磁盘使用率
    
    // 获取系统负载（模拟）
    const loadAvg = os.loadavg()[0];
    
    // 系统状态评估
    let status: 'normal' | 'warning' | 'critical' = 'normal';
    const alerts: Array<{type: 'warning' | 'critical', message: string}> = [];
    
    if (cpuUsage > 85) {
      status = 'critical';
      alerts.push({type: 'critical', message: `CPU使用率过高: ${cpuUsage}%`});
    } else if (cpuUsage > 70) {
      status = 'warning';
      alerts.push({type: 'warning', message: `CPU使用率较高: ${cpuUsage}%`});
    }
    
    if (memUsage > 85) {
      status = 'critical';
      alerts.push({type: 'critical', message: `内存使用率过高: ${memUsage}%`});
    } else if (memUsage > 70) {
      status = 'warning';
      alerts.push({type: 'warning', message: `内存使用率较高: ${memUsage}%`});
    }
    
    if (diskUsage > 85) {
      status = 'critical';
      alerts.push({type: 'critical', message: `磁盘使用率过高: ${diskUsage}%`});
    } else if (diskUsage > 70) {
      status = 'warning';
      alerts.push({type: 'warning', message: `磁盘使用率较高: ${diskUsage}%`});
    }

    const systemData = {
      timestamp: new Date().toISOString(),
      status,
      alerts,
      cpu: {
        usage: cpuUsage,
        cores: os.cpus().length,
        loadAvg: Math.round(loadAvg * 100) / 100
      },
      memory: {
        usage: memUsage,
        used: Math.round(usedMem / 1024 / 1024 / 1024 * 10) / 10, // GB
        total: Math.round(totalMem / 1024 / 1024 / 1024 * 10) / 10, // GB
        free: Math.round(freeMem / 1024 / 1024 / 1024 * 10) / 10 // GB
      },
      disk: {
        usage: diskUsage,
        free: Math.round((1024 - diskInfo.total) / 10) / 100, // GB
        total: Math.round(1024 / 10) / 100, // GB (模拟1TB)
        used: Math.round(diskInfo.total / 10) / 100 // GB
      },
      network: {
        rx: Math.round(Math.random() * 1000 + 100).toString(), // 模拟网络接收
        tx: Math.round(Math.random() * 500 + 50).toString() // 模拟网络发送
      },
      system: {
        hostname: os.hostname(),
        platform: `${os.platform()} ${os.release()}`,
        arch: os.arch(),
        uptime: Math.round(os.uptime() / 3600), // 转换为小时
        distro: process.platform === 'linux' ? 'Ubuntu Server' : os.platform()
      },
      processes: {
        total: storageInfo.technicians.count + storageInfo.announcements.count + storageInfo.customerService.count,
        running: storageInfo.technicians.active + storageInfo.announcements.active + storageInfo.customerService.active,
        blocked: 0
      }
    };

    return NextResponse.json(systemData);
  } catch (error) {
    console.error('System API error:', error);
    return NextResponse.json(
      { error: '获取系统信息失败' },
      { status: 500 }
    );
  }
}

// 获取CPU使用率
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

// 获取磁盘使用情况
async function getDiskUsage() {
  try {
    const stats = await fs.stat('./');
    const dataPath = './data';
    const uploadsPath = './public/uploads';
    
    // 获取数据目录大小
    const dataSize = await getDirectorySize(dataPath);
    const uploadsSize = await getDirectorySize(uploadsPath);
    
    return {
      dataDirectory: {
        path: dataPath,
        size: Math.round(dataSize / 1024 / 1024), // MB
      },
      uploadsDirectory: {
        path: uploadsPath,
        size: Math.round(uploadsSize / 1024 / 1024), // MB
      },
      total: Math.round((dataSize + uploadsSize) / 1024 / 1024) // MB
    };
  } catch (error) {
    console.error('获取磁盘使用情况失败:', error);
    return {
      dataDirectory: { path: './data', size: 0 },
      uploadsDirectory: { path: './public/uploads', size: 0 },
      total: 0
    };
  }
}

// 获取目录大小
async function getDirectorySize(dirPath: string): Promise<number> {
  try {
    let totalSize = 0;
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      
      if (file.isDirectory()) {
        totalSize += await getDirectorySize(filePath);
      } else {
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  } catch (error) {
    return 0;
  }
}

// 获取JSON存储信息
async function getStorageInfo() {
  try {
    const techniciansData = await jsonStorage.read('technicians.json') as any;
    const announcementsData = await jsonStorage.read('announcements.json') as any;
    const customerServiceData = await jsonStorage.read('customer-service.json') as any;
    const adminData = await jsonStorage.read('admin.json') as any;
    
    return {
      technicians: {
        count: techniciansData.technicians?.length || 0,
        active: techniciansData.technicians?.filter((t: any) => t.isActive).length || 0
      },
      announcements: {
        count: announcementsData.announcements?.length || 0,
        active: announcementsData.announcements?.filter((a: any) => a.isActive).length || 0
      },
      customerService: {
        count: customerServiceData.customerService?.length || 0,
        active: customerServiceData.customerService?.filter((cs: any) => cs.isActive).length || 0
      },
      admin: {
        lastLogin: adminData.admin?.lastLogin || null,
        loginAttempts: adminData.admin?.loginAttempts || 0
      }
    };
  } catch (error) {
    console.error('获取存储信息失败:', error);
    return {
      technicians: { count: 0, active: 0 },
      announcements: { count: 0, active: 0 },
      customerService: { count: 0, active: 0 },
      admin: { lastLogin: null, loginAttempts: 0 }
    };
  }
} 