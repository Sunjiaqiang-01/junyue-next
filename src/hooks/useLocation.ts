// useLocation.ts (Stub)
// 位置功能已禁用：始终返回空数据，所有方法为空实现

export interface UseLocationOptions {
  autoFetch?: boolean
  enableCache?: boolean
  watchPosition?: boolean
}

export interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
  address?: string
  city?: string
  timestamp?: number
  source?: string
}

export interface UseLocationReturn {
  location: LocationData | null
  loading: boolean
  error: string | null
  permission: PermissionState | null
  accuracy: number | null
  lastUpdated: number | null

  getCurrentLocation: () => Promise<void>
  requestPermission: () => Promise<boolean>
  clearLocation: () => void
  refreshLocation: () => Promise<void>
}

export function useLocation(_: UseLocationOptions = {}): UseLocationReturn {
  const emptyAsync = async () => {}
  const emptyAsyncBool = async () => false

  return {
    location: null,
    loading: false,
    error: null,
    permission: null,
    accuracy: null,
    lastUpdated: null,
    getCurrentLocation: emptyAsync,
    requestPermission: emptyAsyncBool,
    clearLocation: () => {},
    refreshLocation: emptyAsync
  }
} 