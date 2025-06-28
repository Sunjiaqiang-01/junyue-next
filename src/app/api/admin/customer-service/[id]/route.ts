import { NextRequest, NextResponse } from 'next/server'
import { jsonStorage } from '@/lib/json-storage'
import { CustomerService } from '@/lib/data/types'
import { verifyAdmin } from '@/lib/auth'

// 获取单个客服详情
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
    const customerService = await jsonStorage.findById('customer-service.json', id)
    
    if (!customerService) {
      return NextResponse.json(
        { error: '客服不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: customerService
    })
  } catch (error) {
    console.error('获取客服详情失败:', error)
    return NextResponse.json(
      { error: '获取客服详情失败' },
      { status: 500 }
    )
  }
}

// 更新客服信息
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
    const body = await request.json()
    
    // 验证客服是否存在
    const existingCustomerService = await jsonStorage.findById('customer-service.json', id)
    if (!existingCustomerService) {
      return NextResponse.json(
        { error: '客服不存在' },
        { status: 404 }
      )
    }

    // 如果要更新城市，检查新城市是否已有客服
    if (body.city && body.city !== existingCustomerService.city) {
      const cityCustomerService = await jsonStorage.findAll('customer-service.json', (cs: CustomerService) => {
        return cs.city === body.city && cs.id !== id
      })

      if (cityCustomerService.length > 0) {
        return NextResponse.json(
          { error: '该城市已存在客服' },
          { status: 400 }
        )
      }
    }

    // 更新客服信息
    await jsonStorage.update('customer-service.json', id, body)

    // 获取更新后的客服信息
    const updatedCustomerService = await jsonStorage.findById('customer-service.json', id)

    return NextResponse.json({
      success: true,
      data: updatedCustomerService,
      message: '客服信息更新成功'
    })
  } catch (error) {
    console.error('更新客服信息失败:', error)
    return NextResponse.json(
      { error: '更新客服信息失败' },
      { status: 500 }
    )
  }
}

// 删除客服
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
    
    // 验证客服是否存在
    const existingCustomerService = await jsonStorage.findById('customer-service.json', id)
    if (!existingCustomerService) {
      return NextResponse.json(
        { error: '客服不存在' },
        { status: 404 }
      )
    }

    // 删除客服
    await jsonStorage.delete('customer-service.json', id)

    return NextResponse.json({
      success: true,
      message: '客服删除成功'
    })
  } catch (error) {
    console.error('删除客服失败:', error)
    return NextResponse.json(
      { error: '删除客服失败' },
      { status: 500 }
    )
  }
} 