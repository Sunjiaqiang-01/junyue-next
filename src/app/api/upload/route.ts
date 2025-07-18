import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { verifyAdmin } from '@/lib/auth';
import { COMMON_VIDEO_THUMBNAIL } from '@/lib/media/thumbnail';
import pinyin from 'pinyin';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB for images
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/mov'];

/**
 * 将中文转换为拼音
 * @param text 需要转换的中文文本
 * @returns 拼音字符串，无音调
 */
function convertToPinyin(text: string): string {
  if (!text) return '';
  return pinyin(text, {
    style: pinyin.STYLE_NORMAL, // 无音调
    heteronym: false,           // 不启用多音字
  }).flat().join('');
}

export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'technicians'; // 默认为technicians
    const technicianNickname = formData.get('technicianNickname') as string; // 技师昵称

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (category === 'technicians' && !technicianNickname) {
      return NextResponse.json({ error: 'Technician nickname is required for technician uploads' }, { status: 400 });
    }

    // 将技师昵称转为拼音
    const technicianFolderName = category === 'technicians' && technicianNickname 
      ? convertToPinyin(technicianNickname) 
      : technicianNickname;

    // 验证文件类型和大小
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only images (JPEG, PNG, WebP) and videos (MP4, WebM, MOV) are allowed.' 
      }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      }, { status: 400 });
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ 
        error: `Image too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB` 
      }, { status: 400 });
    }

    // 创建上传目录结构
    let categoryDir: string;
    if (category === 'technicians' && technicianFolderName) {
      // 为技师创建以拼音昵称命名的文件夹
      categoryDir = path.join(UPLOAD_DIR, category, technicianFolderName);
    } else {
      // 其他类别按原来的方式
      categoryDir = path.join(UPLOAD_DIR, category);
    }

    if (!existsSync(categoryDir)) {
      await mkdir(categoryDir, { recursive: true });
    }

    // 获取文件扩展名并生成安全的文件名
    const originalFileName = file.name;
    const fileExtension = path.extname(originalFileName);
    // 将文件名转为拼音+时间戳，确保唯一性和安全性
    const baseName = Date.now() + '_' + convertToPinyin(path.basename(originalFileName, fileExtension));
    const fileName = `${baseName}${fileExtension}`;
    const filePath = path.join(categoryDir, fileName);

    // 保存文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    let thumbnailPath = null;

    // 为图片生成缩略图
    if (isImage) {
      const thumbnailDir = path.join(categoryDir, 'thumbnails');
      if (!existsSync(thumbnailDir)) {
        await mkdir(thumbnailDir, { recursive: true });
      }

      const thumbnailFileName = `thumb_${fileName}`;
      const thumbnailFullPath = path.join(thumbnailDir, thumbnailFileName);
      
      await sharp(buffer)
        .resize(200, 200, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailFullPath);

      if (category === 'technicians' && technicianFolderName) {
        thumbnailPath = `/uploads/${category}/${technicianFolderName}/thumbnails/${thumbnailFileName}`;
      } else {
        thumbnailPath = `/uploads/${category}/thumbnails/${thumbnailFileName}`;
      }
    }

    // 为视频始终使用统一的缩略图
    if (isVideo) {
      thumbnailPath = COMMON_VIDEO_THUMBNAIL;
    }

    // 构建文件URL
    let fileUrl: string;
    if (category === 'technicians' && technicianFolderName) {
      fileUrl = `/uploads/${category}/${technicianFolderName}/${fileName}`;
    } else {
      fileUrl = `/uploads/${category}/${fileName}`;
    }
    
    const response = {
      success: true,
      data: {
        fileName,
        originalName: file.name,
        fileUrl,
        thumbnailUrl: thumbnailPath,
        fileSize: file.size,
        fileType: file.type,
        mediaType: isImage ? 'image' : 'video',
        category,
        technicianNickname: technicianNickname || null,
        uploadedAt: new Date().toISOString()
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'general';
    
    // 获取上传文件列表
    const categoryPath = path.join(UPLOAD_DIR, category);
    
    if (!existsSync(categoryPath)) {
      return NextResponse.json({ 
        success: true,
        data: []
      });
    }
    
    return NextResponse.json({ 
      success: true,
      message: `File listing for ${category} not implemented yet`
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
