import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 重新导出位置相关工具函数
export { formatDistance } from './location'

// 格式化价格显示
export function formatPrice(price: number): string {
  return `¥${price}`
}

// 验证手机号
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

// 验证微信号
export function validateWechat(wechat: string): boolean {
  const wechatRegex = /^[a-zA-Z][-_a-zA-Z0-9]{5,19}$/
  return wechatRegex.test(wechat)
}

// 城市主题色映射
export const cityThemeColors = {
  nanjing: '#D4AF37',    // 金陵金
  suzhou: '#10B981',     // 园林绿
  hangzhou: '#3B82F6',   // 西湖蓝
  wuhan: '#EC4899',      // 樱花粉
  zhengzhou: '#F97316',  // 黄河金
} as const

export type CityType = keyof typeof cityThemeColors

// 获取城市主题色
export function getCityThemeColor(city: CityType): string {
  return cityThemeColors[city] || cityThemeColors.nanjing
}

// 城市显示名称映射
export const cityDisplayNames = {
  nanjing: '南京',
  suzhou: '苏州',
  hangzhou: '杭州',
  wuhan: '武汉',
  zhengzhou: '郑州',
} as const

// 获取城市显示名称
export function getCityDisplayName(city: CityType): string {
  return cityDisplayNames[city] || cityDisplayNames.nanjing
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}