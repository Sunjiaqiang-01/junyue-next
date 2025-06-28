import { NextRequest, NextResponse } from 'next/server'
import { jsonStorage } from '@/lib/json-storage'
import { Announcement } from '@/lib/data/types'

// 获取公告列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // 获取活跃的公告，按优先级排序
    const announcements = await jsonStorage.findAll('announcements.json', (announcement: Announcement) => {
      return announcement.isActive
    })

    // 按优先级排序
    announcements.sort((a, b) => a.priority - b.priority)

    // 限制返回数量
    const limitedAnnouncements = announcements.slice(0, limit)

    return NextResponse.json({
      success: true,
      data: limitedAnnouncements
    })
  } catch (error) {
    console.error('获取公告列表失败:', error)
    return NextResponse.json(
      { error: '获取公告列表失败' },
      { status: 500 }
    )
  }
} 