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
  wuxi: '#3B82F6',       // 太湖蓝
  changzhou: '#F97316',  // 龙城橙
  xuzhou: '#8B5CF6',     // 徐州紫
  nantong: '#22C55E',    // 通州绿
  lianyungang: '#06B6D4', // 海港蓝
  huaian: '#F59E0B',     // 淮安橙
  yancheng: '#4ADE80',   // 盐城绿
  yangzhou: '#EAB308',   // 扬州黄
  zhenjiang: '#EF4444',  // 镇江红
  taizhou: '#14B8A6',    // 泰州青
  suqian: '#A855F7',     // 宿迁紫
  hangzhou: '#3B82F6',   // 西湖蓝
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
  wuxi: '无锡',
  changzhou: '常州',
  xuzhou: '徐州',
  nantong: '南通',
  lianyungang: '连云港',
  huaian: '淮安',
  yancheng: '盐城',
  yangzhou: '扬州',
  zhenjiang: '镇江',
  taizhou: '泰州',
  suqian: '宿迁',
  hangzhou: '杭州',
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