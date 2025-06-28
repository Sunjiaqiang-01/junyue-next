import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth'
import { unlink } from 'fs/promises'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    const { technicianId, mediaPath } = body

    if (!technicianId || !mediaPath) {
      return NextResponse.json(
        { error: '缺少必要参数：technicianId 和 mediaPath' },
        { status: 400 }
      )
    }

    // 构建文件的完整路径
    // mediaPath 格式类似: /uploads/technicians/天佑/fd1eed738a4555ee42db6f21c1285cc2.jpg
    console.log('接收到删除请求:', { technicianId, mediaPath })
    
    const fullPath = path.join(process.cwd(), 'public', mediaPath)
    console.log('完整文件路径:', fullPath)
    
    // 检查文件是否存在
    if (!existsSync(fullPath)) {
      console.log(`文件不存在: ${fullPath}`)
      return NextResponse.json(
        { error: '文件不存在' },
        { status: 404 }
      )
    }

    try {
      // 删除原图
      await unlink(fullPath)
      console.log(`已删除文件: ${fullPath}`)

      // 尝试删除缩略图（如果存在）
      const pathParts = path.parse(fullPath)
      const thumbnailPath = path.join(pathParts.dir, 'thumbnails', `thumb_${pathParts.base}`)
      
      if (existsSync(thumbnailPath)) {
        await unlink(thumbnailPath)
        console.log(`已删除缩略图: ${thumbnailPath}`)
      }

      // 更新JSON数据，从技师记录中移除对应的媒体
      const dataPath = path.join(process.cwd(), 'data', 'technicians.json')
      if (existsSync(dataPath)) {
        try {
          const data = JSON.parse(readFileSync(dataPath, 'utf-8'))
          const technicianIndex = data.technicians.findIndex((t: any) => t.id === technicianId)
          
          if (technicianIndex !== -1) {
            const technician = data.technicians[technicianIndex]
            // 从媒体数组中移除对应的文件
            technician.media = technician.media.filter((media: any) => media.path !== mediaPath)
            technician.updatedAt = new Date().toISOString()
            
            // 重新排序媒体文件
            technician.media.forEach((media: any, index: number) => {
              media.sortOrder = index + 1
            })
            
            // 保存更新后的数据
            writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8')
            console.log(`已从JSON数据中移除媒体记录: ${mediaPath}`)
          }
        } catch (jsonError) {
          console.error('更新JSON数据失败:', jsonError)
          // 即使JSON更新失败，文件已经删除，所以仍然返回成功
        }
      }

      return NextResponse.json({
        success: true,
        message: '媒体文件删除成功'
      })
    } catch (deleteError) {
      console.error('删除文件失败:', deleteError)
      return NextResponse.json(
        { error: '删除文件失败' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('删除媒体文件API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
} 