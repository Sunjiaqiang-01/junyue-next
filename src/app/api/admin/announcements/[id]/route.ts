import { NextRequest, NextResponse } from 'next/server'
import { jsonStorage } from '@/lib/json-storage'
import { Announcement } from '@/lib/data/types'
import { verifyAdmin } from '@/lib/auth'

// 获取单个公告详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const announcement = await jsonStorage.findById('announcements.json', params.id)
    
    if (!announcement) {
      return NextResponse.json(
        { error: '公告不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: announcement
    })
  } catch (error) {
    console.error('获取公告详情失败:', error)
    return NextResponse.json(
      { error: '获取公告详情失败' },
      { status: 500 }
    )
  }
}

// 更新公告信息
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    
    // 验证公告是否存在
    const existingAnnouncement = await jsonStorage.findById('announcements.json', params.id)
    if (!existingAnnouncement) {
      return NextResponse.json(
        { error: '公告不存在' },
        { status: 404 }
      )
    }

    // 更新公告信息
    await jsonStorage.update('announcements.json', params.id, body)

    // 获取更新后的公告信息
    const updatedAnnouncement = await jsonStorage.findById('announcements.json', params.id)

    return NextResponse.json({
      success: true,
      data: updatedAnnouncement,
      message: '公告更新成功'
    })
  } catch (error) {
    console.error('更新公告失败:', error)
    return NextResponse.json(
      { error: '更新公告失败' },
      { status: 500 }
    )
  }
}

// 删除公告
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 验证公告是否存在
    const existingAnnouncement = await jsonStorage.findById('announcements.json', params.id)
    if (!existingAnnouncement) {
      return NextResponse.json(
        { error: '公告不存在' },
        { status: 404 }
      )
    }

    // 删除公告
    await jsonStorage.delete('announcements.json', params.id)

    return NextResponse.json({
      success: true,
      message: '公告删除成功'
    })
  } catch (error) {
    console.error('删除公告失败:', error)
    return NextResponse.json(
      { error: '删除公告失败' },
      { status: 500 }
    )
  }
} 