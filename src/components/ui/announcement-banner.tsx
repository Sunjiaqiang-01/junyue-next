'use client'

import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import { Announcement } from '@/lib/data/types'

// Import Swiper styles
import 'swiper/css'

interface AnnouncementBannerProps {
  className?: string
}

export function AnnouncementBanner({ className = '' }: AnnouncementBannerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements')
      const result = await response.json()
      
      if (result.success) {
        setAnnouncements(result.data)
      } else {
        console.error('获取公告失败:', result.error)
      }
    } catch (error) {
      console.error('获取公告失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`w-full bg-[#D4AF37] text-[#1A2B5C] py-2 px-4 text-center ${className}`}>
        <div className="animate-pulse">
          📢 加载公告中...
        </div>
      </div>
    )
  }

  if (announcements.length === 0) {
    return null
  }

  return (
    <div className={`w-full ${className}`}>
      <Swiper
        modules={[Autoplay]}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
        loop={announcements.length > 1}
        speed={800}
        className="w-full"
      >
        {announcements.map((announcement) => (
          <SwiperSlide key={announcement.id}>
            <div
              className={`
                w-full py-3 px-4 text-center text-sm md:text-base font-medium
                ${announcement.type === 'urgent' 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-[#D4AF37] text-[#1A2B5C]'
                }
                transition-all duration-300
              `}
            >
              <div className="max-w-6xl mx-auto flex items-center justify-center gap-2">
                {/* 公告图标 */}
                <span className="text-lg flex-shrink-0">
                  {announcement.type === 'urgent' ? '🚨' : '📢'}
                </span>
                
                {/* 公告内容 */}
                <div className="flex-1 min-w-0">
                  <span className="font-bold mr-2">{announcement.title}</span>
                  <span className="opacity-90">{announcement.content}</span>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      
      {/* 轮播指示器（仅在多条公告时显示） */}
      {announcements.length > 1 && (
        <div className="flex justify-center gap-1 py-1 bg-gray-100">
          {announcements.map((_, index) => (
            <div
              key={index}
              className="w-1.5 h-1.5 rounded-full bg-gray-400 opacity-60"
            />
          ))}
        </div>
      )}
    </div>
  )
} 