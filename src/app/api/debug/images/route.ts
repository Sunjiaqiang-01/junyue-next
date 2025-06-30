import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { encodeImagePath } from '@/lib/image-utils';

/**
 * 调试API，用于检查图片文件是否存在和可访问
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imagePath = searchParams.get('path');
    
    if (!imagePath) {
      return NextResponse.json({ 
        error: 'Missing path parameter' 
      }, { status: 400 });
    }
    
    // 解码URL编码的路径
    const decodedPath = decodeURIComponent(imagePath);
    
    // 构建绝对路径
    const publicDir = path.join(process.cwd(), 'public');
    let filePath;
    
    // 处理以/uploads开头的路径，这是我们的图片存储路径
    if (decodedPath.startsWith('/uploads/')) {
      filePath = path.join(publicDir, decodedPath);
    } else {
      // 对于其他路径，确保它们都在public目录内
      filePath = path.join(publicDir, decodedPath.replace(/^\//, ''));
    }
    
    // 检查安全性，确保路径没有跳出public目录
    if (!filePath.startsWith(publicDir)) {
      return NextResponse.json({ 
        error: 'Invalid path', 
        details: 'Path attempts to access files outside public directory' 
      }, { status: 403 });
    }
    
    // 检查文件是否存在
    let exists = false;
    let stats = null;
    try {
      stats = await fs.stat(filePath);
      exists = stats.isFile();
    } catch (error) {
      exists = false;
    }
    
    // 获取文件权限信息
    let permissions = null;
    if (exists && stats) {
      permissions = stats.mode.toString(8).slice(-3);  // 八进制表示，取最后三位
    }
    
    // 获取文件所有者信息
    let owner = null;
    if (exists) {
      try {
        const { stdout } = await require('child_process').execPromise(`ls -la "${filePath}"`);
        owner = stdout.trim();
      } catch (error) {
        owner = 'Could not determine';
      }
    }
    
    // 生成图片URL，同时应用我们的编码函数
    const encodedUrl = encodeImagePath(decodedPath);
    const originalEncodedUrl = encodeURIComponent(decodedPath);
    
    // 返回结果
    return NextResponse.json({
      path: {
        requested: imagePath,
        decoded: decodedPath,
        filePath: filePath,
        encodedUrl: encodedUrl,
        originalEncodedUrl: originalEncodedUrl
      },
      file: {
        exists,
        size: exists && stats ? stats.size : null,
        permissions,
        owner
      }
    });
  } catch (error) {
    console.error('Image debug error:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// 添加child_process执行Promise版本
require('child_process').execPromise = function(command: string) {
  return new Promise((resolve, reject) => {
    require('child_process').exec(command, (error: Error | null, stdout: string, stderr: string) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}; 