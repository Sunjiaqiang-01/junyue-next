import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { verifyAdmin } from '@/lib/auth';
import { jsonStorage } from '@/lib/json-storage';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.success) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const customerId = formData.get('customerId') as string;
    
    if (!file) {
      return NextResponse.json({ error: '没有提供文件' }, { status: 400 });
    }

    if (!customerId) {
      return NextResponse.json({ error: '没有提供客服ID' }, { status: 400 });
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ 
        error: '无效的文件类型。只允许图片文件。' 
      }, { status: 400 });
    }

    // 验证文件大小 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ 
        error: '文件太大。最大大小为2MB' 
      }, { status: 400 });
    }

    // 创建上传目录
    const categoryDir = path.join(UPLOAD_DIR, 'customer-service');
    if (!existsSync(categoryDir)) {
      await mkdir(categoryDir, { recursive: true });
    }

    // 获取客服信息
    const customerService = await jsonStorage.findById('customer-service.json', customerId);
    if (!customerService) {
      return NextResponse.json({ error: '客服不存在' }, { status: 404 });
    }

    // 生成文件名（使用客服城市和微信号）
    const safeFileName = `${customerService.city}_${customerService.wechatId}_${Date.now()}.png`;
    const filePath = path.join(categoryDir, safeFileName);

    // 保存文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 更新客服记录
    const qrCodePath = `/uploads/customer-service/${safeFileName}`;
    await jsonStorage.update('customer-service.json', customerId, {
      qrCodePath
    });
    
    // 获取更新后的完整客服对象
    const updatedCustomerService = await jsonStorage.findById('customer-service.json', customerId);

    return NextResponse.json({
      success: true,
      data: {
        qrCodePath,
        customerService: updatedCustomerService
      },
      message: '二维码上传成功'
    });

  } catch (error) {
    console.error('上传失败:', error);
    return NextResponse.json(
      { error: '上传失败' },
      { status: 500 }
    );
  }
} 