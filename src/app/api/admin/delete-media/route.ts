import { NextRequest, NextResponse } from 'next/server'
import { jsonStorage } from '@/lib/json-storage'
import { verifyAdmin } from '@/lib/auth'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// 删除单个媒体文件
export async function DELETE(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { technicianId, mediaIndex, filePath, thumbnailPath, category } = await request.json()

    if (!filePath) {
      return NextResponse.json(
        { error: '缺少文件路径' },
        { status: 400 }
      )
    }

    // 构建实际文件路径
    const fullFilePath = path.join(process.cwd(), 'public', filePath)
    const fullThumbnailPath = thumbnailPath ? path.join(process.cwd(), 'public', thumbnailPath) : null

    // 删除原始文件
    if (existsSync(fullFilePath)) {
      await unlink(fullFilePath)
      console.log(`已删除文件: ${fullFilePath}`)
    }

    // 删除缩略图文件
    if (fullThumbnailPath && existsSync(fullThumbnailPath)) {
      await unlink(fullThumbnailPath)
      console.log(`已删除缩略图: ${fullThumbnailPath}`)
    }

    // 如果是技师文件，需要更新技师数据
    if (category === 'technicians' && technicianId && technicianId !== 'general' && mediaIndex !== undefined) {
      // 获取技师信息
      const technician = await jsonStorage.findById('technicians.json', technicianId)
      if (technician) {
        // 从技师数据中删除媒体记录
        const updatedMedia = technician.media.filter((_: any, index: number) => index !== mediaIndex)
        
        // 重新排序媒体文件的sortOrder
        updatedMedia.forEach((media: any, index: number) => {
          media.id = index + 1
        })

        // 更新技师数据
        await jsonStorage.update('technicians.json', technicianId, {
          media: updatedMedia
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: '媒体文件删除成功'
    })

  } catch (error) {
    console.error('删除媒体文件失败:', error)
    return NextResponse.json(
      { error: '删除媒体文件失败' },
      { status: 500 }
    )
  }
} 