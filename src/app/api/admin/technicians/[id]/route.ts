import { NextRequest, NextResponse } from 'next/server'
import { jsonStorage } from '@/lib/json-storage'
import { Technician } from '@/lib/data/types'
import { verifyAdmin } from '@/lib/auth'
import { rmdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// 获取单个技师详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = await params
    const technician = await jsonStorage.findById('technicians.json', id)
    
    if (!technician) {
      return NextResponse.json(
        { error: '技师不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: technician
    })
  } catch (error) {
    console.error('获取技师详情失败:', error)
    return NextResponse.json(
      { error: '获取技师详情失败' },
      { status: 500 }
    )
  }
}

// 更新技师信息
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = await params
    
    // 检查请求体是否存在
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: '请求头Content-Type必须为application/json' },
        { status: 400 }
      )
    }

    let body
    try {
      const text = await request.text()
      if (!text.trim()) {
        return NextResponse.json(
          { error: '请求体不能为空' },
          { status: 400 }
        )
      }
      body = JSON.parse(text)
    } catch (parseError) {
      console.error('JSON解析错误:', parseError)
      return NextResponse.json(
        { error: '请求体JSON格式错误' },
        { status: 400 }
      )
    }
    
    // 验证技师是否存在
    const existingTechnician = await jsonStorage.findById('technicians.json', id)
    if (!existingTechnician) {
      return NextResponse.json(
        { error: '技师不存在' },
        { status: 404 }
      )
    }

    // 更新技师信息
    await jsonStorage.update('technicians.json', id, body)

    // 获取更新后的技师信息
    const updatedTechnician = await jsonStorage.findById('technicians.json', id)

    return NextResponse.json({
      success: true,
      data: updatedTechnician,
      message: '技师信息更新成功'
    })
  } catch (error) {
    console.error('更新技师信息失败:', error)
    return NextResponse.json(
      { error: '更新技师信息失败' },
      { status: 500 }
    )
  }
}

// 删除技师
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = await params
    
    // 验证技师是否存在
    const existingTechnician = await jsonStorage.findById('technicians.json', id)
    if (!existingTechnician) {
      return NextResponse.json(
        { error: '技师不存在' },
        { status: 404 }
      )
    }

    // 删除技师的媒体文件夹
    const technicianFolderPath = path.join(process.cwd(), 'public', 'uploads', 'technicians', existingTechnician.nickname)
    if (existsSync(technicianFolderPath)) {
      try {
        await rmdir(technicianFolderPath, { recursive: true })
        console.log(`已删除技师 ${existingTechnician.nickname} 的媒体文件夹`)
      } catch (error) {
        console.error(`删除技师媒体文件夹失败:`, error)
        // 即使文件夹删除失败，也继续删除数据库记录
      }
    }

    // 删除技师数据
    await jsonStorage.delete('technicians.json', id)

    return NextResponse.json({
      success: true,
      message: '技师及其媒体文件删除成功'
    })
  } catch (error) {
    console.error('删除技师失败:', error)
    return NextResponse.json(
      { error: '删除技师失败' },
      { status: 500 }
    )
  }
} 