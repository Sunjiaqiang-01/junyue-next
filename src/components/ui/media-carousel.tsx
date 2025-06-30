'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import { TechnicianMedia } from '@/lib/data/types'
import { cn } from '@/lib/utils'
import { getThumbnailUrl } from '@/lib/media/thumbnail'

// 导入Swiper样式
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface MediaCarouselProps {
  media: TechnicianMedia[]
  className?: string
  aspectRatio?: string
  showThumbnails?: boolean
}

export function MediaCarousel({ 
  media, 
  className,
  aspectRatio = "aspect-[3/4]",
  showThumbnails = false 
}: MediaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isImageFullscreen, setIsImageFullscreen] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const swiperRef = useRef<any>(null)

  if (!media || media.length === 0) {
    return (
      <div className={cn(
        "w-full bg-gray-200 flex items-center justify-center",
        aspectRatio,
        className
      )}>
        <div className="text-gray-500 text-center">
          <div className="text-4xl mb-2">📷</div>
          <p className="text-sm">暂无图片</p>
        </div>
      </div>
    )
  }

  const currentMedia = media[activeIndex]

  // 处理媒体点击
  const handleMediaClick = (item: TechnicianMedia, index: number) => {
    if (item.type === 'image') {
      setActiveIndex(index)
      setIsImageFullscreen(true)
    } else {
      // 视频在卡片内播放
      setIsVideoPlaying(true)
    }
  }

  // 处理视频播放结束
  const handleVideoEnded = () => {
    setIsVideoPlaying(false)
  }

  return (
    <>
      {/* 主轮播 */}
      <div className={cn("relative overflow-hidden rounded-lg", className)}>
        {/* 视频播放模式 */}
        {isVideoPlaying && currentMedia.type === 'video' ? (
          <div className={cn("relative w-full", aspectRatio)}>
            <video
              src={currentMedia.path}
              controls
              autoPlay
              className="w-full h-full object-cover"
              onEnded={handleVideoEnded}
              onPause={() => setIsVideoPlaying(false)}
            >
              您的浏览器不支持视频播放
            </video>
            {/* 关闭按钮 */}
            <button
              onClick={() => setIsVideoPlaying(false)}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-10"
            >
              ✕
            </button>
          </div>
        ) : (
          /* 轮播模式 */
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={0}
            slidesPerView={1}
            navigation={false} // 禁用默认导航，使用自定义
            pagination={{
              clickable: true,
              bulletClass: 'swiper-pagination-bullet bg-white/50',
              bulletActiveClass: 'swiper-pagination-bullet-active bg-white',
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper
            }}
            onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
            className={cn("w-full", aspectRatio)}
          >
            {media.map((item, index) => (
              <SwiperSlide key={`${item.path}-${index}`}>
                <div 
                  className="relative w-full h-full cursor-pointer group"
                  onClick={() => handleMediaClick(item, index)}
                >
                  {item.type === 'image' ? (
                    // 使用原生img标签替代Next.js Image组件
                    <img
                      src={item.path}
                      alt={item.description || `媒体 ${index + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      {/* 使用原生img标签替代Next.js Image组件 */}
                      <img
                        src={getThumbnailUrl(item.type, item.thumbnail, item.path)}
                        alt={item.description || `视频 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* 播放按钮 */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors">
                          <div className="w-0 h-0 border-l-[20px] border-l-black border-y-[12px] border-y-transparent ml-1"></div>
                        </div>
                      </div>
                      {/* 视频标识 */}
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        视频
                      </div>
                    </div>
                  )}
                  
                  {/* 悬停提示 */}
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.type === 'image' ? '点击放大' : '点击播放'}
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}

        {/* 自定义导航按钮 - 只在轮播模式且有多个媒体时显示 */}
        {!isVideoPlaying && media.length > 1 && (
          <>
            <button 
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                swiperRef.current?.slidePrev()
              }}
            >
              ←
            </button>
            <button 
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                swiperRef.current?.slideNext()
              }}
            >
              →
            </button>
          </>
        )}

        {/* 媒体计数 - 只在轮播模式时显示 */}
        {!isVideoPlaying && (
          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-5">
            {activeIndex + 1} / {media.length}
          </div>
        )}
      </div>

      {/* 缩略图 */}
      {showThumbnails && media.length > 1 && !isVideoPlaying && (
        <div className="flex gap-2 mt-2 overflow-x-auto">
          {media.map((item, index) => (
            <button
              key={`${item.path}-${index}-thumb`}
              onClick={() => {
                setActiveIndex(index)
                swiperRef.current?.slideTo(index)
              }}
              className={cn(
                "flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden relative",
                activeIndex === index ? "border-primary" : "border-gray-300"
              )}
            >
              {/* 使用原生img标签替代Next.js Image组件 */}
              <img
                src={getThumbnailUrl(item.type, item.thumbnail, item.path)}
                alt={`缩略图 ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {/* 视频标识 */}
              {item.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-4 h-4 bg-white/80 rounded-full flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[6px] border-l-black border-y-[3px] border-y-transparent ml-0.5"></div>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 图片全屏查看模态框 */}
      {isImageFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button
            onClick={() => setIsImageFullscreen(false)}
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-10"
          >
            ✕
          </button>
          
          <div className="relative max-w-4xl max-h-full">
            {/* 使用原生img标签替代Next.js Image组件 */}
            <img
              src={currentMedia.path}
              alt={currentMedia.description || '图片'}
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </>
  )
} 
