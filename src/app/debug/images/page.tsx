'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { encodeImagePath } from '@/lib/image-utils'

export default function ImageDebug() {
  const [imagePath, setImagePath] = useState<string>('/uploads/technicians/阿哲/1750482080431.jpg')
  const [debugResult, setDebugResult] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [loadStatus, setLoadStatus] = useState<'loading' | 'success' | 'error' | null>(null)
  
  // 预设图片路径供测试
  const presetPaths = [
    '/uploads/technicians/阿哲/1750482080431.jpg',
    '/uploads/technicians/阿哲/1750482068320.jpg',
    '/uploads/technicians/阿哲/8c7283840f003e2b6397ba2f41a95af6_.jpg',
    '/uploads/technicians/阿哲/thumbnails/thumb_1750482080431.jpg',
    '/assets/image-placeholder.png'
  ]
  
  const checkImage = async (path: string) => {
    setLoading(true)
    setDebugResult(null)
    setLoadStatus('loading')
    
    try {
      // 调用我们的调试API
      const response = await fetch(`/api/debug/images?path=${encodeURIComponent(path)}`)
      const data = await response.json()
      setDebugResult(data)
    } catch (error) {
      console.error('Debug request failed:', error)
      setDebugResult({ error: 'Request failed', details: error instanceof Error ? error.message : String(error) })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">图片加载调试</h1>
      
      <div className="mb-8">
        <h2 className="text-xl mb-2">图片路径测试</h2>
        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            value={imagePath} 
            onChange={(e) => setImagePath(e.target.value)}
            className="flex-grow border p-2 rounded"
            placeholder="输入图片路径"
          />
          <button 
            onClick={() => checkImage(imagePath)}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            {loading ? '检查中...' : '检查'}
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          {presetPaths.map((path, index) => (
            <button 
              key={index}
              onClick={() => {
                setImagePath(path)
                checkImage(path)
              }}
              className="bg-gray-200 hover:bg-gray-300 p-2 rounded text-left text-sm truncate"
            >
              {path}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl mb-4">图片预览</h2>
          <div className="border p-4 rounded mb-2 bg-gray-50 min-h-[300px] flex flex-col items-center justify-center">
            {imagePath && (
              <>
                <div className="mb-4 text-sm text-gray-500">原始路径: {imagePath}</div>
                <div className="mb-4 text-sm text-gray-500">编码路径: {encodeImagePath(imagePath)}</div>
                <div className="relative w-64 h-64 mb-2 border">
                  <Image 
                    src={imagePath} 
                    alt="测试图片" 
                    fill
                    style={{ objectFit: 'contain' }}
                    onLoad={() => setLoadStatus('success')}
                    onError={() => setLoadStatus('error')}
                  />
                </div>
                <div className="text-center mt-2">
                  {loadStatus === 'loading' && <span className="text-blue-500">加载中...</span>}
                  {loadStatus === 'success' && <span className="text-green-500">加载成功</span>}
                  {loadStatus === 'error' && <span className="text-red-500">加载失败</span>}
                </div>
              </>
            )}
            {!imagePath && <div className="text-gray-400">请输入图片路径</div>}
          </div>
          
          <h3 className="font-bold mt-4">尝试直接IMG标签：</h3>
          <div className="border p-4 rounded bg-gray-50">
            <img 
              src={imagePath} 
              alt="原生IMG测试" 
              className="max-w-full h-auto max-h-[200px] mx-auto"
            />
          </div>
        </div>
        
        <div>
          <h2 className="text-xl mb-4">调试结果</h2>
          <div className="border p-4 rounded bg-gray-50 min-h-[300px] overflow-auto">
            {loading && <div className="text-center">加载中...</div>}
            {!loading && !debugResult && <div className="text-center text-gray-400">点击"检查"按钮获取图片信息</div>}
            {!loading && debugResult && (
              <pre className="text-sm">{JSON.stringify(debugResult, null, 2)}</pre>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl mb-2">图片加载排障</h2>
        <ul className="list-disc pl-5">
          <li>检查文件权限：确保文件可以被Nginx和Node.js访问</li>
          <li>检查路径编码：中文路径可能需要特殊处理</li>
          <li>检查文件存在：确认服务器上是否存在该文件</li>
          <li>检查MIME类型：确保服务器正确设置了Content-Type</li>
          <li>检查缓存控制：可能需要清除浏览器缓存或设置no-cache头</li>
        </ul>
      </div>
    </div>
  )
} 