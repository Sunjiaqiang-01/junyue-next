"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  className?: string
  backgroundColor?: string
  progressColor?: string
  showText?: boolean
  icon?: React.ReactNode
}

export function ProgressRing({
  progress = 0,
  size = 100,
  strokeWidth = 8,
  className,
  backgroundColor = '#e5e7eb',
  progressColor = '#3b82f6',
  showText = true,
  icon
}: ProgressRingProps) {
  // 确保进度在0-100之间
  const normalizedProgress = Math.min(100, Math.max(0, progress))
  
  // 计算圆形路径参数
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference

  const center = size / 2

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* 背景圆圈 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke={backgroundColor}
        />
        
        {/* 进度圆圈 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke={
            progressColor === 'auto' 
              ? normalizedProgress > 80 
                ? '#ef4444' 
                : normalizedProgress > 60 
                  ? '#f59e0b' 
                  : '#10b981'
              : progressColor
          }
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      
      {/* 中间文字或图标 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {icon ? (
          icon
        ) : showText ? (
          <span className="text-lg font-semibold">{Math.round(normalizedProgress)}%</span>
        ) : null}
        </div>
    </div>
  )
} 