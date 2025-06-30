'use client'

import { useState } from 'react'
import Image, { ImageProps } from 'next/image'
import { getSafeImagePath } from '@/lib/image-utils'

interface ImageWithFallbackProps extends Omit<ImageProps, 'src'> {
  src: string
  fallbackSrc?: string
  alt: string
}

/**
 * 带有后备方案的图片组件
 * 自动处理中文路径和加载失败情况
 */
export function ImageWithFallback({
  src,
  fallbackSrc = '/assets/image-placeholder.png',
  alt,
  ...props
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false)
  
  // 使用安全处理后的图片路径
  const safeSrc = error ? fallbackSrc : getSafeImagePath(src, fallbackSrc)
  
  return (
    <Image
      {...props}
      src={safeSrc}
      alt={alt}
      onError={() => setError(true)}
    />
  )
}
