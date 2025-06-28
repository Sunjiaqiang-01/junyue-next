import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { verifyAdmin } from '@/lib/auth';
import { jsonStorage } from '@/lib/json-storage';
import { TechniciansData, Technician } from '@/lib/data/types';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'technicians');
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'];

export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!existsSync(UPLOAD_DIR)) {
      return NextResponse.json({ 
        error: 'Technicians upload directory does not exist' 
      }, { status: 404 });
    }

    // 读取所有技师数据
    const techniciansData = await jsonStorage.read<TechniciansData>('technicians.json');
    let updatedCount = 0;

    // 扫描uploads/technicians目录
    const technicianFolders = await readdir(UPLOAD_DIR);

    for (const folderName of technicianFolders) {
      const folderPath = path.join(UPLOAD_DIR, folderName);
      const folderStat = await stat(folderPath);

      // 跳过非文件夹
      if (!folderStat.isDirectory()) continue;

      // 查找对应的技师
      const technician = techniciansData.technicians.find((t: Technician) => t.nickname === folderName);
      if (!technician) {
        console.log(`No technician found for folder: ${folderName}`);
        continue;
      }

      // 扫描技师文件夹中的媒体文件
      const mediaFiles = await readdir(folderPath);
      const newMedia: any[] = [];
      let sortOrder = 1;

      for (const fileName of mediaFiles) {
        // 跳过thumbnails文件夹
        if (fileName === 'thumbnails') continue;

        const filePath = path.join(folderPath, fileName);
        const fileStat = await stat(filePath);

        // 跳过文件夹
        if (fileStat.isDirectory()) continue;

        const fileExtension = path.extname(fileName).toLowerCase();
        let mediaType: 'image' | 'video' | null = null;

        if (ALLOWED_IMAGE_EXTENSIONS.includes(fileExtension)) {
          mediaType = 'image';
        } else if (ALLOWED_VIDEO_EXTENSIONS.includes(fileExtension)) {
          mediaType = 'video';
        }

        if (mediaType) {
          const mediaPath = `/uploads/technicians/${folderName}/${fileName}`;
          
          // 查找对应的缩略图
          let thumbnailPath = mediaPath; // 默认使用原图作为缩略图
          const thumbnailDir = path.join(folderPath, 'thumbnails');
          
          if (existsSync(thumbnailDir)) {
            const thumbnailFiles = await readdir(thumbnailDir);
            const baseName = path.basename(fileName, fileExtension);
            
            // 查找匹配的缩略图文件
            const thumbnailFile = thumbnailFiles.find(thumb => 
              thumb.startsWith('thumb_') && thumb.includes(baseName)
            );
            
            if (thumbnailFile) {
              thumbnailPath = `/uploads/technicians/${folderName}/thumbnails/${thumbnailFile}`;
            } else if (mediaType === 'video') {
              // 为视频生成改进的缩略图
              try {
                const timestamp = Date.now();
                const randomString = Math.random().toString(36).substring(2, 8);
                const thumbnailFileName = `thumb_${baseName}_${timestamp}_${randomString}.jpg`;
                const thumbnailFullPath = path.join(thumbnailDir, thumbnailFileName);
                
                // 生成带有播放图标的视频缩略图
                await sharp({
                  create: {
                    width: 200,
                    height: 200,
                    channels: 3,
                    background: { r: 45, g: 45, b: 45 } // 深灰色背景
                  }
                })
                .composite([
                  {
                    input: Buffer.from(
                      `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                        <!-- 渐变背景 -->
                        <defs>
                          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:0.8" />
                            <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:0.8" />
                          </linearGradient>
                          <filter id="shadow">
                            <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
                          </filter>
                        </defs>
                        
                        <!-- 背景矩形 -->
                        <rect width="200" height="200" fill="url(#bg)" />
                        
                        <!-- 视频图标 -->
                        <rect x="40" y="60" width="120" height="80" rx="8" fill="white" opacity="0.9" filter="url(#shadow)" />
                        <rect x="50" y="70" width="100" height="60" rx="4" fill="#1F2937" />
                        
                        <!-- 播放按钮 -->
                        <circle cx="100" cy="100" r="20" fill="white" opacity="0.95" filter="url(#shadow)" />
                        <polygon points="92,88 92,112 116,100" fill="#1F2937" />
                        
                        <!-- 文字标识 -->
                        <text x="100" y="170" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white" opacity="0.9">
                          VIDEO
                        </text>
                      </svg>`
                    ),
                    top: 0,
                    left: 0
                  }
                ])
                .jpeg({ quality: 85 })
                .toFile(thumbnailFullPath);
                
                thumbnailPath = `/uploads/technicians/${folderName}/thumbnails/${thumbnailFileName}`;
              } catch (error) {
                console.error('Failed to generate video thumbnail:', error);
                // 如果生成失败，使用原视频路径
                thumbnailPath = mediaPath;
              }
            }
          } else if (mediaType === 'video') {
            // 创建thumbnails目录并生成视频缩略图
            try {
              await mkdir(thumbnailDir, { recursive: true });
              const timestamp = Date.now();
              const randomString = Math.random().toString(36).substring(2, 8);
              const baseName = path.basename(fileName, fileExtension);
              const thumbnailFileName = `thumb_${baseName}_${timestamp}_${randomString}.jpg`;
              const thumbnailFullPath = path.join(thumbnailDir, thumbnailFileName);
              
              // 生成带有播放图标的视频缩略图
              await sharp({
                create: {
                  width: 200,
                  height: 200,
                  channels: 3,
                  background: { r: 45, g: 45, b: 45 }
                }
              })
              .composite([
                {
                  input: Buffer.from(
                    `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:0.8" />
                          <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:0.8" />
                        </linearGradient>
                        <filter id="shadow">
                          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
                        </filter>
                      </defs>
                      <rect width="200" height="200" fill="url(#bg)" />
                      <rect x="40" y="60" width="120" height="80" rx="8" fill="white" opacity="0.9" filter="url(#shadow)" />
                      <rect x="50" y="70" width="100" height="60" rx="4" fill="#1F2937" />
                      <circle cx="100" cy="100" r="20" fill="white" opacity="0.95" filter="url(#shadow)" />
                      <polygon points="92,88 92,112 116,100" fill="#1F2937" />
                      <text x="100" y="170" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white" opacity="0.9">
                        VIDEO
                      </text>
                    </svg>`
                  ),
                  top: 0,
                  left: 0
                }
              ])
              .jpeg({ quality: 85 })
              .toFile(thumbnailFullPath);
              
              thumbnailPath = `/uploads/technicians/${folderName}/thumbnails/${thumbnailFileName}`;
            } catch (error) {
              console.error('Failed to generate video thumbnail:', error);
              thumbnailPath = mediaPath;
            }
          }

          newMedia.push({
            type: mediaType,
            path: mediaPath,
            thumbnail: thumbnailPath,
            description: `${technician.nickname}的${mediaType === 'image' ? '照片' : '视频'}`,
            sortOrder: sortOrder++
          });
        }
      }

      // 更新技师的媒体数据
      if (newMedia.length > 0) {
        technician.media = newMedia;
        technician.updatedAt = new Date().toISOString();
        updatedCount++;
      }
    }

    // 保存更新后的数据
    if (updatedCount > 0) {
      await jsonStorage.write('technicians.json', techniciansData);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced media for ${updatedCount} technicians`,
      data: {
        scannedFolders: technicianFolders.length,
        updatedTechnicians: updatedCount
      }
    });

  } catch (error) {
    console.error('Sync media error:', error);
    return NextResponse.json(
      { error: 'Failed to sync media files' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!existsSync(UPLOAD_DIR)) {
      return NextResponse.json({ 
        error: 'Technicians upload directory does not exist' 
      }, { status: 404 });
    }

    // 扫描目录结构
    const technicianFolders = await readdir(UPLOAD_DIR);
    const folderInfo = [];

    for (const folderName of technicianFolders) {
      const folderPath = path.join(UPLOAD_DIR, folderName);
      const folderStat = await stat(folderPath);

      if (folderStat.isDirectory()) {
        const files = await readdir(folderPath);
        const mediaFiles = files.filter(file => {
          const ext = path.extname(file).toLowerCase();
          return [...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_VIDEO_EXTENSIONS].includes(ext);
        });

        folderInfo.push({
          folderName,
          mediaCount: mediaFiles.length,
          files: mediaFiles
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: folderInfo
    });

  } catch (error) {
    console.error('Get folder info error:', error);
    return NextResponse.json(
      { error: 'Failed to get folder information' },
      { status: 500 }
    );
  }
} 