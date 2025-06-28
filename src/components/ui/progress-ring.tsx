import React from 'react';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showText?: boolean;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#1A2B5C',
  backgroundColor = '#E5E7EB',
  showText = true,
  className = ''
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const getProgressColor = (value: number) => {
    if (value > 85) return '#EF4444'; // 红色
    if (value > 70) return '#F59E0B'; // 黄色
    return color; // 默认颜色
  };

  const progressColor = getProgressColor(progress);

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* 背景圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* 进度圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      
      {showText && (
        <div className="absolute text-center">
          <div className={`text-2xl font-bold ${progress > 85 ? 'text-red-600' : progress > 70 ? 'text-yellow-600' : 'text-gray-900'}`}>
            {Math.round(progress)}%
          </div>
        </div>
      )}
    </div>
  );
}; 